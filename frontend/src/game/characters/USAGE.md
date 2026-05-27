# Using PlayerCharacter in Tidebound Weeks

The `PlayerCharacter` system provides a reusable, animated explorer that weeks can control.

## Basic Usage

```js
// In your week's create() method
this.player = ctx.createPlayerCharacter({
  x: 120,
  y: 180,
  size: 26,
});

// Later in update()
this.player.update(scene, time, delta);
```

## Available Abilities

| Key (default) | Method                  | Description |
|---------------|-------------------------|-----------|
| Arrows / WASD | —                       | Move the explorer |
| Mouse Click   | —                       | Click-to-move |
| **Space**     | `player.dash()`         | Short powerful dash |
| **E**         | `player.grab(obj)` / `throwCarried()` | Pick up and throw objects |
| **Q**         | `player.surge()`        | Strong forward cone push on nearby objects |

## Useful Methods

```js
player.setSpeed(200);                    // Change movement speed
player.celebrate(900);                   // Play success animation
player.grab(someOrb);                    // Pick up an object
player.throwCarried(1.2);                // Throw with extra strength
player.releaseCarried();                 // Drop without throwing
player.surge(1.0);                       // Strong push (returns push data)
player.overlaps(target);                 // Simple overlap check
player.getBody();                        // Access underlying Arcade physics body
```

## Events

```js
player.events.on('dash', () => { ... });
player.events.on('grab', ({ object }) => { ... });
player.events.on('throw', ({ object, vx, vy }) => { ... });
player.events.on('surge', (data) => { ... });
player.events.on('requestGrab', () => { ... }); // When player presses E with nothing
```

## Best Practices

1. **Let weeks own the logic** — `PlayerCharacter` handles movement and visuals. Weeks decide when to call `grab()`, apply `surge()` forces, etc.

2. **Use `ctx.createPlayerCharacter()`** — This is the recommended way. It automatically wires control legends and hints.

3. **Clean up in `shutdown()`**:
   ```js
   shutdown() {
     if (this.player) this.player = null;
   }
   ```

4. **Objects you want to carry** should support `x`, `y`, and ideally `setData('vx', ...)` for velocity.

## Example Pattern (from demo-push.js)

```js
this.player.events.on('requestGrab', () => {
  for (const orb of this.orbs) {
    if (this.player.overlaps(orb)) {
      this.player.grab(orb);
      break;
    }
  }
});
```

See the demo weeks (`demo-push.js`, `demo-relay.js`, etc.) for full examples of integration.
