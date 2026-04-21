# Chain Reaction ⚛️

A high-performance, aesthetically pleasing implementation of the classic strategy board game **Chain Reaction**, built entirely from scratch using **Vanilla Web Technologies** (HTML, CSS, JavaScript) and powered by **Custom Data Structures** under the hood.

![Game Preview](./style.css) *(Add a screenshot or animated GIF of the game here)*

## 🎮 Play the Game
[**Play it Live!**](https://thunder-11.github.io/chain-reaction/) *(If deploying via GitHub Pages)*

## 🌟 Features

*   **Multiplayer Strategy:** Play with 2, 3, or 4 players on dynamically sizable grids (6×6, 8×8, or 10×10).
*   **Custom Data Structures (DSA) Engine:** Optimized performance avoiding unneeded built-in Javascript functions. The game is driven by an underlying engine built on fundamental data structures.
*   **Visually Stunning:** Rich UI utilizing advanced CSS variables, real-time scoreboard progress bars, and slick animations. 
*   **Physics-like Animations:** Enjoy custom DOM-based visual effects like particle flight, cell flashing, shockwave expansion, and dynamic orb orbiting when cells near critical mass.
*   **Synthesized Web Audio:** Reactive gameplay powered by the Web Audio API with procedurally generated sound effects.
*   **Persistent Theme:** Toggleable light/dark mode for your viewing comfort.
*   **Accessibility First:** Fully playable via keyboard navigation (Arrow keys + Enter/Space) and semantic DOM structure.

## 🧠 Under the Hood (Custom DSA)
This project is an exercise in rigorous application engineering. Instead of relying off of Javascript's garbage collector and array `.shift()` methods, this game ships with custom-built data structures to handle operations safely and performantly:

*   **`HashTable`**: Implements **Open Addressing with Linear Probing** to keep real-time tracking of cell ownership and player metrics.
*   **`CircularLinkedList`**: Manages the cyclical nature of player turns.
*   **`Queue`**: Facilitates the Breadth-First Search (BFS) algorithmic approach for triggering chain-reaction explosions cleanly step-by-step.
*   **`Stack`**: Maintains the history of board states efficiently allowing for endless "Undo" operations without state bleeding.

> 🛠️ **Debug Mode**: Press the `DSA` Debug button in the HUD during gameplay to open an overlay panel. This visualizes real-time metrics including Stack sizes, live cell allocations, and the current internal slots of the HashTable!

## 🚀 Getting Started

To run the game locally, no heavy build tools, frameworks, or bundlers are required! 

1. **Clone the repository**
   ```bash
   git clone https://github.com/thunder-11/chain-reaction.git
   cd chain-reaction
   ```

2. **Serve the project**
   Because this project uses ES6 Modules (or if you want to avoid CORS issues when fetching local assets in the future), you should serve it via a local HTTP server.
   
   If you have Node.js installed, you can easily run:
   ```bash
   npx http-server
   ```
   *Alternatively, you can use the Live Server VS Code extension, or Python's `python -m http.server`.*

3. **Enjoy!**
   Navigate to `http://localhost:8080` (or your respective local port) in your web browser.

## 🕹️ How to Play

1. **Objective:** Eliminate your opponents by capturing their atoms and taking over the entire board. 
2. **Setup:** Choose the board size and the number of players. You can modify player names as well.
3. **Taking Turns:** Players take turns placing atoms in empty cells or cells they already own.
4. **Critical Mass:** Every cell has a limit (Critical Mass) based on its location:
    * Corners: max **1 atom**
    * Edges: max **2 atoms**
    * Center cells: max **3 atoms**
5. **Explosion:** When an atom is placed into a cell that already holds its critical mass, it explodes! The atoms scatter into the neighboring orthogonal cells, taking over any enemy atoms present and possibly triggering a **chain reaction**.

## 🛠️ Tech Stack & Philosophy

*   **HTML5:** Semantic markup, leveraging native properties.
*   **Vanilla CSS3:** Utilizing complex CSS Custom Properties, flexbox/grid layout, media queries, and `@keyframes` animations. Zero Tailwind or external UI libraries used.
*   **Vanilla JavaScript (ES6+):** Pure logic orchestration, DOM manipulation, custom algorithms, and `requestAnimationFrame` hooks. Zero dependencies.

## 🤝 Contributing

Contributions to improve optimizations, UI scaling, or animation logic are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
*Built with ❤️ for strategy and optimized algorithms.*
