// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import "./App.css";

function App() {
  return (
    <>
      <MantineProvider>
        <h1>Welcome to Singleton Ebook</h1>
      </MantineProvider>
    </>
  );
}

export default App;
