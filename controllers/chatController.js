const chatbot = async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `You are a blood donation assistant. Answer in short.\nUser: ${userMessage}\nBot:`,
        stream: false,
      }),
    });

    const data = await response.json();

    res.json({ reply: data.response });
  } catch (error) {
    console.log("Ollama Error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
};

module.exports = {
  chatbot,
};
