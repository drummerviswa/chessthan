# 🏆 Chessthan - Online Multiplayer Chess Platform

### 🏎️ Try it out -> [chessthan.vercel.app](https://chessthan.vercel.app)

Chessthan is an interactive online chess platform that let players challenge others in real-time, watch ongoing games, and enjoy smooth animations for an immersive experience.

This is the project inspired from [chessu](https://github.com/dotnize/chessu).

Thank you Nathaniel Tampus [[dotnize]](https://github.com/dotnize) for the inspiration. Your projects are awesome.

## 🚀 Features

- Play real-time chess matches against other users
- Spectate and chat in ongoing games
- Create an account to track stats and game history
- [Underconstruction🏗️] Play against AI
- Mobile-friendly responsive design
- Smooth animations using **Lottie & Animate.css**

## 🛠 Tech Stack

- **Frontend:** Next.js, Tailwind CSS, DaisyUI
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL
- **Animations:** Lottie, Animate.css

## 🔧 Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v20 or newer recommended)
- **PostgreSQL**
- **pnpm** (for monorepo management)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/chessthan.git
   cd chessthan
   ```
2. Install dependencies  
   Client:
   ```bash
   cd client
   npm install
   ```
   Server:
   ```bash
   cd server
   npm install
   ```
3. Set up the **.env** file in the server directory with database credentials
4. Start the Development servers  
   Client:
   ```bash
    cd client
    npm run dev
   ```
   Server:
   ```bash
   cd server
   npm run dev
   ```
5. Start the frontend
   ```bash
   cd client
   npm dev
   ```

## 🎯 Roadmap

- [ ] Implement ChatGPT for play analysis
- [ ] Leaderboard & player ranking system
- [ ] Implement AI for single-player mode
- [ ] Account management & password reset

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo, open issues, or submit pull requests.

## 📜 License

This project is open-source and licensed under the MIT License.
