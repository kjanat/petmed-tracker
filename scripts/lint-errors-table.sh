#!/usr/bin/env bash

# Zsh completion function (can be sourced separately)
# To enable: echo 'source /path/to/this/script --completion' >> ~/.zshrc
completion_function() {
    local script_name=$(basename "$0")
    cat <<EOF
#compdef ${script_name}

_${script_name//-/_}() {
    local context state line
    typeset -A opt_args

    _arguments -C \\
        '(-t --table-only)'{-t,--table-only}'[Show only the error table (no summary)]' \\
        '(-s --summary-only)'{-s,--summary-only}'[Show only the summary (no table)]' \\
        '(-l --links)'{-l,--links}'[Enable clickable file links (experimental)]' \\
        '(-n --max-issues)'{-n,--max-issues}'[Max issues to show in summary]:number:(5 10 15 20 25)' \\
        '(-f --max-files)'{-f,--max-files}'[Max files to show in summary]:number:(5 10 15 20 25)' \\
        '(-h --help)'{-h,--help}'[Show this help message]'
}

compdef _${script_name//-/_} ${script_name}
EOF
}

# Handle completion setup
if [[ "${1:-}" == "--completion" ]]; then
    completion_function
    exit 0
fi

# Git root & terminal width
git_root=$(git rev-parse --show-toplevel 2>/dev/null)
term_width=$(tput cols)

# CLI options
show_table=true
show_summary=true
show_hyperlinks=false
max_issues=10
max_files=10

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Format Biome lint errors in a readable table with optional summaries.

OPTIONS:
  -t, --table-only        Show only the error table (no summary)
  -s, --summary-only      Show only the summary (no table)
  -l, --links             Enable clickable file links (experimental)
  -n, --max-issues NUM    Max issues to show in summary (default: 10)
  -f, --max-files NUM     Max files to show in summary (default: 10)
  -h, --help              Show this help message
  --completion            Print zsh completion function

EXAMPLES:
  $0                      # Show table and summary
  $0 -t                   # Table only
  $0 -s                   # Summary only
  $0 -l                   # With clickable links
  $0 -s -n 5              # Summary with top 5 issues
EOF
}

make_link() {
    local file="$1" line="$2" col="$3"
    if [[ "$show_hyperlinks" == "true" && -n "$git_root" ]]; then
        local full_path="$git_root/$file"
        local url="vscode://file${full_path}:$line:$col"
        printf "\e]8;;%s\e\\%s:%s:%s\e]8;;\e\\" "$url" "$file" "$line" "$col"
    else
        printf "%s:%s:%s" "$file" "$line" "$col"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
    -t | --table-only)
        show_summary=false
        shift
        ;;
    -s | --summary-only)
        show_table=false
        shift
        ;;
    -l | --links)
        show_hyperlinks=true
        shift
        ;;
    -n | --max-issues)
        max_issues="$2"
        shift 2
        ;;
    -f | --max-files)
        max_files="$2"
        shift 2
        ;;
    -h | --help)
        usage
        exit 0
        ;;
    --completion)
        completion_function
        exit 0
        ;;
    *)
        echo "Unknown option: $1" >&2
        usage >&2
        exit 1
        ;;
    esac
done

# Validate numeric arguments
if ! [[ "$max_issues" =~ ^[0-9]+$ ]] || [[ "$max_issues" -le 0 ]]; then
    echo "Error: --max-issues must be a positive integer" >&2
    exit 1
fi

if ! [[ "$max_files" =~ ^[0-9]+$ ]] || [[ "$max_files" -le 0 ]]; then
    echo "Error: --max-files must be a positive integer" >&2
    exit 1
fi

# Run Biome once
raw=$(bun run ci:check 2>&1)

# Check if there are any errors
if ! echo "$raw" | grep -q "::error"; then
    echo "No lint errors found! 🎉"
    exit 0
fi

if [[ "$show_table" == "true" ]]; then
    # Extract fields: Location<TAB>Rule<TAB>Message
    mapfile -t rows < <(
        echo "$raw" |
            grep "::error" |
            sed -E 's/.*title=([^,]+),file=([^,]+),line=([0-9]+),endLine=[^,]*,col=([0-9]+),endColumn=[^:]*::(.*)/\2:\3:\4\t\1\t\5/' |
            sort -t$'\t' -k1,1
    )

    # Init max widths with header lengths
    hdr1="Location"
    hdr2="Rule"
    hdr3="Message"
    max1=${#hdr1}
    max2=${#hdr2}
    max3=${#hdr3}

    # Measure actual row lengths (without hyperlink escape codes)
    for row in "${rows[@]}"; do
        IFS=$'\t' read -r loc rule msg <<<"$row"
        ((${#loc} > max1)) && max1=${#loc}
        ((${#rule} > max2)) && max2=${#rule}
        ((${#msg} > max3)) && max3=${#msg}
    done

    # Build format string
    fmt="%-${max1}s  %-${max2}s  %-${max3}s\n"

    # Calculate table width (include spaces between columns)
    calculated_width=$((max1 + 2 + max2 + 2 + max3))
    divider_width=$((calculated_width > term_width ? term_width : calculated_width))

    # Print header
    printf "$fmt" "$hdr1" "$hdr2" "$hdr3"
    printf -- '%*s\n' "$divider_width" '' | tr ' ' '-'

    # Print rows
    for row in "${rows[@]}"; do
        IFS=$'\t' read -r loc rule msg <<<"$row"

        # Create link if hyperlinks enabled
        if [[ "$loc" =~ ^([^:]+):([0-9]+):([0-9]+)$ ]]; then
            file="${BASH_REMATCH[1]}"
            line="${BASH_REMATCH[2]}"
            col="${BASH_REMATCH[3]}"
            display_loc=$(make_link "$file" "$line" "$col")
        else
            display_loc="$loc"
        fi

        # For hyperlinks, we need manual padding since printf can't calculate visible width
        if [[ "$show_hyperlinks" == "true" ]]; then
            padding_needed=$((max1 - ${#loc}))
            spaces=$(printf "%*s" $padding_needed "")
            printf "%s%s  %-${max2}s  %-${max3}s\n" "$display_loc" "$spaces" "$rule" "$msg"
        else
            printf "$fmt" "$display_loc" "$rule" "$msg"
        fi
    done
fi

if [[ "$show_summary" == "true" ]]; then
    # Add spacing between table and summary
    [[ "$show_table" == "true" ]] && echo

    echo "=== SUMMARY ==="
    echo

    echo "Most Common Issues:"
    echo "$raw" |
        grep "::error" |
        sed -E 's/.*title=([^,]+),.*/\1/' |
        sort | uniq -c | sort -rn | head -n "$max_issues" |
        awk '{ printf "  %3d × %s\n", $1, $2 }'

    echo
    echo "Files with Most Errors:"
    echo "$raw" |
        grep "::error" |
        sed -E 's/.*file=([^,]+),.*/\1/' |
        sort | uniq -c | sort -rn | head -n "$max_files" |
        awk '{ printf "  %3d × %s\n", $1, $2 }'
fi
