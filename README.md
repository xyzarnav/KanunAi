# KanunAi

Comprehensive Legal Assistant for summarising legal documents, clarifying legal doubts, finding similarity between past cases, etc.


## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd majorProject
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:3001`

2. **Start the frontend application**
   ```bash
   cd frontend
   npm run dev
   ```
   Application will run on `http://localhost:3000`

### Building for Production

1. **Build Backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 Licenses

This project is licensed under the ISC License.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Express.js Documentation](https://expressjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🐍 AI Service notes

If you use the Python `ai-service/` for local summarization, there was a known issue where uploaded PDFs were attempted to be read as UTF-8 text which crashes with a UnicodeDecodeError. This has been fixed by detecting PDF files (by extension or file header) and using a PDF loader instead of text-mode reading.

To run the ai-service locally, install Python dependencies listed in `ai-service/requirements.txt` and run the service in that folder. Example:

```powershell
cd ai-service
python -m pip install -r requirements.txt
# then run your ai-service script as needed
```

If you still see decoding errors when uploading files, please open an issue with the file name and stack trace.