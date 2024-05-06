const fs = require("fs");

const OpenAI = require("openai");

const { Pinecone } = require("@pinecone-database/pinecone");

const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const pinecone = new Pinecone();

const pineconeIndexName = process.env.PINE_CONE_INDEX;

const pineconeNameSpace = process.env.PINE_CONE_NAMESPACE;

const pineconeApiKey = process.env.PINE_CONE_API_KEY;

const cleanText = async (text) => {
  const data = await fs.promises.readFile("./sample.txt", "utf-8");
  const lines = data.split("\n").filter((line) => line !== "");
  const cleanLines = lines.map((line) =>
    line.replace(/[^a-zA-Z ]/g, "").toLowerCase()
  );
  const cleanText = cleanLines.join("\n");
  await fs.promises.writeFile("./clean-wikipedia.txt", cleanText);
};

const createChunks = async () => {
  const cleanText = await fs.readFileSync("./clean-wikipedia.txt", "utf-8");
  const lines = cleanText.split("\n");
  const chunks = [];
  for (let i = 0; i < lines.length; i++) {
    const chunk = lines.slice(i, i + 3);
    chunks.push(chunk.join("\n"));
  }
  return chunks;
};

const createEmbeddings = async (text) => {
  const config = {
    model: "text-embedding-ada-002",
    input: text,
  };
  const response = await openai.embeddings.create(config);
  return response;
};

const createEmbeddingsForChunks = async () => {
  const chunks = await createChunks();
  // console.log(chunks)
  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await createEmbeddings(chunk);
    embeddings.push({
      text: chunk,
      embedding,
    });
  }
  return embeddings;
};

const start = async () => {
  const pinecone = new Pinecone({
    // environment: process.env.PINE_CONE_ENVIRONMENT,
    apiKey: process.env.PINE_CONE_API_KEY,
  });

  const index = await pinecone.Index(pineconeIndexName);
  const embeds = await createEmbeddingsForChunks();
  console.log(embeds);
};

start();
