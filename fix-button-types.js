#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
	const items = readdirSync(dir);

	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);

		if (
			stat.isDirectory() &&
			!item.startsWith(".") &&
			!item.startsWith("node_modules")
		) {
			findTsxFiles(fullPath, files);
		} else if (item.endsWith(".tsx")) {
			files.push(fullPath);
		}
	}

	return files;
}

// Function to fix button types in a file
function fixButtonTypes(filePath) {
	let content = readFileSync(filePath, "utf8");
	let changed = false;

	// Pattern 1: <button\s+onClick - buttons with onClick first
	const pattern1 = /<button\s+onClick/g;
	if (pattern1.test(content)) {
		content = content.replace(
			/<button\s+onClick/g,
			'<button\n\t\t\t\t\ttype="button"\n\t\t\t\t\tonClick',
		);
		changed = true;
	}

	// Pattern 2: <button\s+disabled - buttons with disabled first
	const pattern2 = /<button\s+disabled/g;
	if (pattern2.test(content)) {
		content = content.replace(
			/<button\s+disabled/g,
			'<button\n\t\t\t\t\ttype="button"\n\t\t\t\t\tdisabled',
		);
		changed = true;
	}

	// Pattern 3: <button\s+key - buttons with key first
	const pattern3 = /<button\s+key/g;
	if (pattern3.test(content)) {
		content = content.replace(/<button\s+key/g, "<button\n\t\t\t\t\tkey");
		changed = true;
	}

	// Pattern 4: <button\s+className - buttons with className first
	const pattern4 = /<button(\s+)className/g;
	if (pattern4.test(content)) {
		content = content.replace(
			/<button(\s+)className/g,
			'<button$1type="button"$1className',
		);
		changed = true;
	}

	if (changed) {
		writeFileSync(filePath, content);
		console.log(`Fixed button types in: ${filePath}`);
	}

	return changed;
}

// Main function
function main() {
	const srcDir = "./src";
	const tsxFiles = findTsxFiles(srcDir);

	console.log(`Found ${tsxFiles.length} .tsx files`);

	let totalFixed = 0;
	for (const file of tsxFiles) {
		if (fixButtonTypes(file)) {
			totalFixed++;
		}
	}

	console.log(`Fixed ${totalFixed} files`);

	// Run linter to see remaining issues
	try {
		execSync("bun run check:summary", { stdio: "inherit" });
	} catch {
		console.log("Lint check completed with remaining issues");
	}
}

main();
