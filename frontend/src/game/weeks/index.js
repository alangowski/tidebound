const weekLoaders = {
  1: () => import("./week1.js"),
  2: () => import("./week2.js"),
  3: () => import("./week3.js"),
  4: () => import("./week4.js"),
  5: () => import("./week5.js"),
  6: () => import("./week6.js"),
  7: () => import("./week7.js"),
  8: () => import("./week8.js"),
  9: () => import("./week9.js"),
  10: () => import("./week10.js"),
  11: () => import("./week11.js"),
  12: () => import("./week12.js"),
  // Demo of the new animated player character system.
  // Accessible via the "Try Explorer Character Demo" button on the title screen.
  demo: () => import("./demo-character.js"),
  "demo-navigator": () => import("./demo-navigator.js"),
  "demo-currents": () => import("./demo-currents.js"),
  "demo-push": () => import("./demo-push.js"),
  "demo-rush": () => import("./demo-rush.js"),
  "demo-relay": () => import("./demo-relay.js"),
};

export default weekLoaders;
