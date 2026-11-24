# Breakout RN

A React Native port of a JavaScript Canvas brick-breaker built for the .NET 2 course at the European University of Armenia. The Expo app runs the game locally. The separate C# project, BreakoutApi, stores online runs, serves profiles and rankings, and hosts a web dashboard.

## Play the game

Enter a nickname and tap **Play**. Point above the paddle and release to launch. Drag horizontally during a run to move the paddle. A center hit sends the ball up, and an edge hit sends it sideways. Clear the bricks to advance. Destroy several bricks between paddle hits to build a combo, and catch power-ups to widen the paddle or slow the ball. Active power-ups appear below the play/pause button.

**My Profile** shows your local best, online stats, and friends. Open **Find people** from the Friends section and type at least two characters. Results update as you type. Compare the short profile IDs when names match. The other player can then accept your request. **Leaderboard** ranks uploaded runs. **Settings** controls the theme and haptics.

## Run locally

Use Node.js and npm for the app. Node.js 24 was used during development. Install the .NET 10 SDK if you want to run BreakoutApi.

### Offline play

From the BrickBreakerGame directory:

```sh
npm ci
npx expo start
```

Open the app from the Expo terminal. Game logic, settings, and personal bests work offline. After changing the API URL or adding a native module, restart Expo. If you use a custom native development build that predates Expo SecureStore, rebuild it once to use online profiles.

### Online profiles and leaderboard

1. From the separate BreakoutApi directory, start the API. It applies EF Core migrations on startup and uses `scores.db` in the project directory by default.

   ```powershell
   dotnet run --no-launch-profile --urls http://0.0.0.0:5000
   ```

   Docker is also supported. Run `docker compose up --build` from BreakoutApi. Compose publishes port 5000 and stores SQLite under the `./data` bind mount.

2. Add `.env.local` in BrickBreakerGame and restart Expo. Replace the example IP with the computer's LAN address for a physical phone on the same network.

   ```dotenv
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
   ```

   | Where the client runs | Example API URL |
   | --- | --- |
   | Phone on the same Wi-Fi network | `http://192.168.1.100:5000` |
   | Standard Android emulator on the API host | `http://10.0.2.2:5000` |
   | Browser on the API host | `http://localhost:5000` |

   Use an HTTPS API URL for a public build. Open [the local dashboard](http://localhost:5000/dashboard) to see what the API has stored.

3. Open **My Profile**, finish a run, then open **Leaderboard**. The run should appear in your profile history and on the dashboard. If the API is offline, the game can still update your local personal best. Failed uploads are currently single attempts and aren't queued.

Profiles use a nickname and a credential saved per installation or browser and API URL. Players can share a nickname. Existing leaderboard scores without a profile stay visible as historical runs. Switching API URLs or clearing storage can leave the old profile inaccessible. Email sign-in and cross-device recovery are future work.

## Read the code

- [Architecture and project walkthrough](docs/ARCHITECTURE.md) traces every major feature from screen to hook, service, API endpoint, and database. It includes diagrams and questions you might get during a demo.
- [GameCanvas.tsx](src/components/game/GameCanvas.tsx) is the active board, game loop, hit effects, and run completion coordinator.
- [collisions.ts](src/game/collisions.ts) contains the wall, brick, paddle, and game-over rules.
- [leaderboardApi.ts](src/services/leaderboardApi.ts) and [playerProfile.ts](src/services/playerProfile.ts) are the Expo app's connection to BreakoutApi.
- The separate BreakoutApi project has its own README with the endpoint reference, database shape, and server startup instructions.

## Test

```sh
npx tsc --noEmit
npm test -- --watchAll=false --runInBand
```

The Jest suite covers entity creation, walls, brick geometry, paddle bounces, game over, and gesture callback behavior for aiming. For a gameplay change, first add or adjust a test and confirm it fails for the expected reason. Then make the change and run the entire suite. For changes in how gameplay looks or feels, also check a real device or emulator.

## Credits

Originally written as a browser Canvas game and ported to Expo and React Native for the .NET 2 course.
