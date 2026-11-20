// Copyright (C) 2026 Marc Gimpel.
// This file is part of the SingletonEbook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    singleton_ebook_lib::run()
}
