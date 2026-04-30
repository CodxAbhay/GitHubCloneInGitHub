const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");
const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");
const { Document } = require("@langchain/core/documents");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const axios = require("axios");

const Chat = require("../models/chatModel");
const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");

const chat = async (req, res) => {
  try {
    const { message, userId, repoId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite-preview",
      apiKey: process.env.GEMINI_API_KEY,
      maxRetries: 3,
    });

    // Load Chat History
    let chatDoc = await Chat.findOne({ user: userId });
    if (!chatDoc) {
      chatDoc = new Chat({ user: userId, messages: [] });
    }

    const chatHistory = chatDoc.messages.map(msg => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      if (msg.role === "model") return new AIMessage(msg.content);
      return new SystemMessage(msg.content);
    });

    // Save user message
    chatDoc.messages.push({ role: "user", content: message });

    let systemContext = "You are GitChat, a helpful AI assistant for the AntiGitHUB platform.";
    let vectorStore = null;

    if (repoId) {
      // Setup RAG for repo
      const repo = await Repository.findById(repoId);
      if (repo) {
        systemContext += `\nYou are currently assisting the user within the repository: ${repo.name}. Context from the repository code will be provided below if relevant.`;
        
        // Fetch latest commit files
        const latestCommit = await Commit.findOne({ repository: repoId }).sort({ createdAt: -1 });
        if (latestCommit && latestCommit.files && latestCommit.files.length > 0) {
          try {
            const documents = [];
            for (const file of latestCommit.files) {
              if (file.url && file.fileName.match(/\.(js|jsx|ts|tsx|md|json|html|css|py|java|c|cpp|h|cs)$/i)) {
                try {
                  const fileRes = await axios.get(file.url);
                  let content = typeof fileRes.data === 'string' ? fileRes.data : JSON.stringify(fileRes.data);
                  documents.push(new Document({
                    pageContent: content,
                    metadata: { source: file.fileName }
                  }));
                } catch (fetchErr) {
                  console.error("Failed to fetch file for RAG:", file.fileName);
                }
              }
            }

            if (documents.length > 0) {
              let allContext = documents.map(d => `File: ${d.metadata.source}\nContent:\n${d.pageContent}`).join("\n\n");
              
              if (allContext.length < 300000) {
                // If the repo is small enough, give the full context directly
                systemContext += `\n\nRepository Context:\n${allContext}`;
              } else {
                // Fallback to RAG if too large
                const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
                const splitDocs = await textSplitter.splitDocuments(documents);
                const embeddings = new GoogleGenerativeAIEmbeddings({ model: "text-embedding-004", apiKey: process.env.GEMINI_API_KEY });
                vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
              }
            }
          } catch (e) {
            console.error("RAG Setup Error:", e);
          }
        }
      }
    }

    let finalPrompt = message;
    if (vectorStore) {
      const results = await vectorStore.similaritySearch(message, 5); // Increased to 5 chunks for better context
      if (results.length > 0) {
        const contextStr = results.map(r => `File: ${r.metadata.source}\nContent: ${r.pageContent}`).join("\n\n");
        finalPrompt = `Context from repository:\n${contextStr}\n\nUser Question: ${message}`;
      }
    }

    const messagesToSent = [
      new SystemMessage(systemContext),
      ...chatHistory,
      new HumanMessage(finalPrompt)
    ];

    const result = await llm.invoke(messagesToSent);
    
    // Save model response
    chatDoc.messages.push({ role: "model", content: result.content });
    await chatDoc.save();

    res.json({ success: true, text: result.content });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ success: false, message: "AI chat failed." });
  }
};

const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const chatDoc = await Chat.findOne({ user: userId });
    
    if (!chatDoc) {
      return res.json({ success: true, history: [] });
    }

    const formattedHistory = chatDoc.messages.map(msg => ({
      sender: msg.role === "user" ? "user" : "model",
      text: msg.content
    }));

    res.json({ success: true, history: formattedHistory });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
}

const explainCode = async (req, res) => {
  try {
    const { code, filename } = req.body;
    
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite-preview",
      apiKey: process.env.GEMINI_API_KEY,
      maxRetries: 3,
    });

    const prompt = `Please explain the following code. It is from a file named ${filename || 'unknown'}. Keep the explanation concise, clear, and structured. 
    
Code:
${code}`;

    const result = await llm.invoke([new HumanMessage(prompt)]);

    res.json({ success: true, text: result.content });
  } catch (error) {
    console.error("Error in AI explain code:", error);
    const msg = error?.status === 503 ? "Gemini API is experiencing high demand. Please try again later." : "AI explanation failed.";
    res.status(500).json({ success: false, message: msg });
  }
};

module.exports = {
  chat,
  getHistory,
  explainCode
};
