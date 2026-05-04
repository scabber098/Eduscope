// === Static Node.js Lecture Data for AI Insights ===
const nodejsLectures = [
  {
    id: "nodejs-01",
    title: "Introduction to Node.js",
    topics: ["What is Node.js", "V8 Engine", "Event-Driven Architecture", "Non-Blocking I/O", "Node.js vs Browser JS"],
    difficulty: "Beginner",
    summary: "Node.js is a runtime environment that allows JavaScript to run on the server side. Built on Chrome's V8 engine, it uses an event-driven, non-blocking I/O model that makes it lightweight and efficient for building scalable network applications. Unlike browser JavaScript, Node.js provides access to the file system, network, and operating system.",
    common_mistakes: [
      "Confusing Node.js with a programming language — it is a runtime, not a language.",
      "Assuming Node.js is multi-threaded by default — it uses a single-threaded event loop with background worker threads for heavy tasks.",
      "Thinking Node.js is only for web servers — it is used for CLI tools, desktop apps (Electron), IoT, and more.",
      "Mixing up global objects: 'window' does not exist in Node.js; use 'global' or 'globalThis' instead."
    ],
    interview_questions: [
      "What is Node.js and how does it differ from browser-based JavaScript?",
      "Explain the V8 engine and its role in Node.js.",
      "What does 'non-blocking I/O' mean in the context of Node.js?",
      "Why is Node.js considered single-threaded, and how does it handle concurrency?",
      "What are some use cases where Node.js is a good fit and where it is not?"
    ],
    real_world_usage: [
      "Netflix uses Node.js to handle millions of streaming requests with low startup time.",
      "LinkedIn rebuilt their mobile backend with Node.js, reducing servers from 30 to 3.",
      "PayPal migrated from Java to Node.js and saw a 35% decrease in average response time.",
      "NASA uses Node.js for accessing data related to EVA (spacewalk) procedures to keep astronauts safe."
    ]
  },
  {
    id: "nodejs-02",
    title: "Modules & require() System",
    topics: ["CommonJS Modules", "require() and module.exports", "ES Modules (import/export)", "Built-in Modules", "Module Caching"],
    difficulty: "Beginner",
    summary: "Node.js uses a module system to organize code into reusable units. CommonJS (require/module.exports) is the traditional approach, while ES Modules (import/export) are now natively supported. Built-in modules like 'fs', 'path', and 'http' provide core functionality. Node.js caches modules after the first load, so require() returns the same object on subsequent calls.",
    common_mistakes: [
      "Forgetting that require() is synchronous and blocks execution — avoid using it inside hot code paths.",
      "Using module.exports and exports interchangeably without understanding that reassigning 'exports' breaks the reference.",
      "Not understanding module caching — modifying a required module's exports affects all files that import it.",
      "Mixing CommonJS and ES Module syntax in the same file without proper configuration (package.json 'type' field)."
    ],
    interview_questions: [
      "What is the difference between CommonJS and ES Modules in Node.js?",
      "Explain how module caching works in Node.js.",
      "What happens when you do module.exports = something vs exports.something = value?",
      "How does Node.js resolve module paths when you call require()?",
      "What is the purpose of the 'type' field in package.json?"
    ],
    real_world_usage: [
      "Large-scale applications like VS Code organize thousands of files using Node.js module system.",
      "npm (Node Package Manager) relies entirely on the module system — every package is a module.",
      "Microservice architectures use modules to encapsulate business logic into separate, deployable units.",
      "Build tools like Webpack and Rollup analyze module dependencies to create optimized bundles."
    ]
  },
  {
    id: "nodejs-03",
    title: "File System (fs) Module",
    topics: ["Reading Files", "Writing Files", "Async vs Sync Methods", "Streams for Large Files", "File Watchers"],
    difficulty: "Beginner",
    summary: "The 'fs' module provides an API to interact with the file system. It offers both synchronous (blocking) and asynchronous (non-blocking) methods for reading, writing, updating, and deleting files. For large files, streams should be used instead of reading entire files into memory. The fs.promises API provides a modern async/await interface.",
    common_mistakes: [
      "Using synchronous methods (readFileSync) in production servers — this blocks the event loop and kills performance.",
      "Not handling file encoding — forgetting to pass 'utf8' returns a Buffer instead of a string.",
      "Reading entire large files into memory with readFile instead of using createReadStream.",
      "Not properly handling errors in callbacks — unhandled errors crash the process.",
      "Forgetting to close file descriptors when using fs.open(), leading to memory leaks."
    ],
    interview_questions: [
      "What is the difference between fs.readFile and fs.readFileSync?",
      "When would you use Streams instead of fs.readFile?",
      "How do you handle errors in asynchronous file operations?",
      "Explain fs.promises and how it improves code readability.",
      "What is a file descriptor and why is it important to close them?"
    ],
    real_world_usage: [
      "Log management systems use fs streams to process gigabytes of log files without running out of memory.",
      "Static site generators like Gatsby read and transform thousands of files using the fs module.",
      "Configuration management tools read JSON/YAML config files at startup using fs.",
      "File upload services use write streams to save uploaded data chunk by chunk to disk."
    ]
  },
  {
    id: "nodejs-04",
    title: "Event Loop & Asynchronous Patterns",
    topics: ["Event Loop Phases", "Callbacks", "Promises", "async/await", "Microtasks vs Macrotasks"],
    difficulty: "Intermediate",
    summary: "The event loop is the heart of Node.js — it enables non-blocking I/O by offloading operations to the system kernel or thread pool, then processing their callbacks when complete. It has phases: timers, pending callbacks, poll, check, and close. Understanding the difference between microtasks (Promise.then, process.nextTick) and macrotasks (setTimeout, setImmediate) is critical for predicting execution order.",
    common_mistakes: [
      "Assuming async operations run in parallel threads — they are handled by the event loop, libuv thread pool, or OS kernel.",
      "Creating callback hell by nesting multiple async operations instead of using Promises or async/await.",
      "Not understanding that process.nextTick() runs before Promise.then() in the microtask queue.",
      "Using setTimeout(fn, 0) expecting it to run immediately — it runs in the next timer phase, not immediately.",
      "Blocking the event loop with CPU-intensive synchronous operations (heavy computations, large JSON parsing)."
    ],
    interview_questions: [
      "Explain the phases of the Node.js event loop.",
      "What is the difference between process.nextTick() and setImmediate()?",
      "How do microtasks and macrotasks differ in execution priority?",
      "What happens if you block the event loop, and how do you avoid it?",
      "Convert a callback-based function to use Promises and async/await."
    ],
    real_world_usage: [
      "Real-time chat applications rely on the event loop to handle thousands of concurrent WebSocket connections.",
      "API gateways use non-blocking I/O to proxy requests to multiple backend services simultaneously.",
      "Task queues like Bull use the event loop with Redis to process background jobs efficiently.",
      "Monitoring dashboards use event loop lag measurements to detect performance bottlenecks in production."
    ]
  },
  {
    id: "nodejs-05",
    title: "HTTP Module & Building Servers",
    topics: ["http.createServer()", "Request & Response Objects", "Routing", "Status Codes", "Serving Static Files"],
    difficulty: "Intermediate",
    summary: "The built-in 'http' module lets you create HTTP servers without any framework. The createServer method takes a callback with request and response objects. You can inspect request method, URL, and headers to implement routing. While frameworks like Express abstract this away, understanding the raw HTTP module is essential for grasping how Node.js handles web traffic.",
    common_mistakes: [
      "Forgetting to call res.end() — the client hangs indefinitely waiting for a response.",
      "Not setting Content-Type headers, causing browsers to misinterpret response data.",
      "Trying to set headers after res.write() or res.end() has been called — throws 'Headers already sent' error.",
      "Not parsing the request body for POST requests — req.body does not exist by default in raw http module.",
      "Ignoring favicon.ico requests that browsers automatically send."
    ],
    interview_questions: [
      "How do you create a basic HTTP server in Node.js without Express?",
      "What is the difference between res.write() and res.end()?",
      "How would you implement basic routing using only the http module?",
      "How do you read the request body from a POST request?",
      "What happens if you never call res.end()?"
    ],
    real_world_usage: [
      "Health check endpoints in microservices often use raw http module to avoid framework overhead.",
      "Proxy servers use the http module to forward and transform requests between services.",
      "Webhook receivers parse incoming HTTP POST data from third-party services like GitHub or Stripe.",
      "Load testing tools like autocannon use raw http to generate high-throughput test traffic."
    ]
  },
  {
    id: "nodejs-06",
    title: "Express.js Fundamentals",
    topics: ["Middleware", "Routing", "Request/Response Helpers", "Error Handling", "Template Engines"],
    difficulty: "Intermediate",
    summary: "Express.js is the most popular Node.js web framework. It simplifies server creation with a powerful middleware system, declarative routing (app.get, app.post, etc.), and helpful utilities for parsing JSON, serving static files, and handling errors. Middleware functions execute sequentially and can modify request/response objects or terminate the request cycle.",
    common_mistakes: [
      "Forgetting to call next() in middleware — the request gets stuck and never reaches the route handler.",
      "Placing error-handling middleware before routes — it must come after all routes to catch errors.",
      "Not using express.json() middleware and wondering why req.body is undefined for POST requests.",
      "Defining routes after app.listen() — routes must be registered before the server starts listening.",
      "Using app.use() without understanding that it matches all HTTP methods and path prefixes."
    ],
    interview_questions: [
      "What is middleware in Express.js and how does the middleware chain work?",
      "How does error handling middleware differ from regular middleware?",
      "Explain the difference between app.use() and app.get().",
      "How would you structure an Express app for a large-scale project?",
      "What is the purpose of the next() function in middleware?"
    ],
    real_world_usage: [
      "Uber's backend originally used Express.js for handling ride request APIs.",
      "Most REST APIs in startups are built with Express due to its simplicity and ecosystem.",
      "Authentication flows using Passport.js are implemented as Express middleware chains.",
      "API versioning (v1, v2) is commonly managed using Express Router instances."
    ]
  },
  {
    id: "nodejs-07",
    title: "Streams & Buffers",
    topics: ["Readable Streams", "Writable Streams", "Transform Streams", "Piping", "Buffers & Binary Data"],
    difficulty: "Advanced",
    summary: "Streams are collections of data that might not be available all at once. They allow reading or writing data piece by piece, making them memory-efficient for large datasets. There are four types: Readable, Writable, Duplex, and Transform. Buffers are temporary storage for binary data. The pipe() method connects a readable stream to a writable stream, handling backpressure automatically.",
    common_mistakes: [
      "Not handling the 'error' event on streams — unhandled errors crash the process.",
      "Ignoring backpressure — writing data faster than it can be consumed leads to memory bloat.",
      "Confusing Buffers with strings — Buffers hold raw binary data and need explicit encoding conversion.",
      "Not using pipeline() from stream/promises — it handles cleanup and errors better than manual piping.",
      "Forgetting that streams are EventEmitters — you must listen for events like 'data', 'end', 'error'."
    ],
    interview_questions: [
      "What are the four types of streams in Node.js?",
      "Explain backpressure and how Node.js handles it.",
      "What is the difference between pipe() and pipeline()?",
      "How do Buffers work and when would you use them?",
      "How would you implement a Transform stream?"
    ],
    real_world_usage: [
      "Video streaming platforms use readable streams to serve video content without loading entire files.",
      "CSV/JSON data processing pipelines transform millions of records using Transform streams.",
      "File compression tools (gzip) use streams to compress data on the fly during transfer.",
      "HTTP responses in Express can stream data directly to clients for real-time data feeds."
    ]
  },
  {
    id: "nodejs-08",
    title: "Error Handling & Debugging",
    topics: ["try/catch with async/await", "Error-First Callbacks", "Custom Error Classes", "Unhandled Rejections", "Debugging with inspect"],
    difficulty: "Intermediate",
    summary: "Robust error handling is crucial in Node.js applications. Synchronous errors use try/catch, while async errors require .catch() on Promises or try/catch with async/await. The error-first callback pattern (err, data) is a Node.js convention. Unhandled promise rejections and uncaught exceptions should be caught globally to prevent silent failures. The built-in debugger (node --inspect) integrates with Chrome DevTools.",
    common_mistakes: [
      "Not catching errors in async functions — unhandled promise rejections can terminate the process in newer Node versions.",
      "Using try/catch around a callback-based function expecting it to catch async errors — it won't.",
      "Throwing strings instead of Error objects — you lose the stack trace.",
      "Catching errors silently (empty catch blocks) — bugs become invisible and impossible to debug.",
      "Not setting up process.on('unhandledRejection') and process.on('uncaughtException') handlers."
    ],
    interview_questions: [
      "How do you handle errors in async/await code vs callback-based code?",
      "What is the error-first callback pattern?",
      "How would you create a custom error class in Node.js?",
      "What happens when a Promise rejection is not handled?",
      "How do you debug a Node.js application using Chrome DevTools?"
    ],
    real_world_usage: [
      "Production services use structured error logging (Winston, Pino) with error classes to categorize failures.",
      "API servers return appropriate HTTP status codes by mapping custom error classes to responses.",
      "Sentry and Datadog integrate with Node.js to capture and track unhandled exceptions in production.",
      "Circuit breaker patterns use error handling to gracefully degrade when downstream services fail."
    ]
  },
  {
    id: "nodejs-09",
    title: "Working with Databases (MongoDB & Mongoose)",
    topics: ["MongoDB Connection", "Mongoose Schemas & Models", "CRUD Operations", "Validation", "Indexing & Performance"],
    difficulty: "Intermediate",
    summary: "MongoDB is the most common database paired with Node.js. Mongoose is an ODM (Object Data Modeling) library that provides schema validation, type casting, and query building. You define schemas to enforce structure on MongoDB's flexible documents, create models to interact with collections, and perform CRUD operations using intuitive methods like find(), create(), updateOne(), and deleteOne().",
    common_mistakes: [
      "Not handling connection errors — the app silently fails if MongoDB is unreachable.",
      "Forgetting to define indexes on frequently queried fields — queries become slow at scale.",
      "Using findOne() + save() for updates instead of findOneAndUpdate() — causes race conditions.",
      "Not validating data at the schema level — trusting client-side validation alone leads to bad data.",
      "Storing passwords in plain text instead of hashing with bcrypt before saving."
    ],
    interview_questions: [
      "What is the difference between MongoDB and Mongoose?",
      "How do you define a schema with validation in Mongoose?",
      "Explain the difference between findOneAndUpdate and find + save.",
      "What are indexes in MongoDB and why are they important?",
      "How would you handle database connection failures gracefully?"
    ],
    real_world_usage: [
      "E-commerce platforms store product catalogs in MongoDB due to its flexible schema for varying product attributes.",
      "Content management systems use Mongoose schemas to enforce structure while allowing dynamic fields.",
      "Real-time analytics dashboards aggregate MongoDB data using the aggregation pipeline.",
      "User authentication systems store hashed credentials with Mongoose middleware (pre-save hooks)."
    ]
  },
  {
    id: "nodejs-10",
    title: "REST API Design & Best Practices",
    topics: ["RESTful Principles", "Route Structure", "Input Validation", "Authentication (JWT)", "Rate Limiting & Security"],
    difficulty: "Advanced",
    summary: "REST API design in Node.js involves structuring endpoints around resources (nouns, not verbs), using HTTP methods correctly (GET, POST, PUT, DELETE), and following conventions like proper status codes and pagination. Security measures include JWT-based authentication, input validation (Joi, express-validator), rate limiting, CORS configuration, and helmet.js for security headers.",
    common_mistakes: [
      "Using verbs in URLs (GET /getUsers) instead of nouns (GET /users).",
      "Returning 200 for every response including errors — use appropriate status codes (400, 401, 404, 500).",
      "Storing JWT tokens in localStorage — use httpOnly cookies to prevent XSS attacks.",
      "Not validating request body/params — SQL injection and NoSQL injection are real threats.",
      "Not implementing pagination — returning all records crashes the server with large datasets."
    ],
    interview_questions: [
      "What are the key principles of RESTful API design?",
      "How does JWT authentication work in a Node.js API?",
      "How would you implement rate limiting to prevent abuse?",
      "What is the difference between authentication and authorization?",
      "How do you handle API versioning in a Node.js application?"
    ],
    real_world_usage: [
      "Stripe's API is a gold standard of REST design — Node.js SDKs follow these patterns.",
      "Social media platforms use JWT tokens to authenticate mobile and web clients against Node.js APIs.",
      "API gateways like Kong enforce rate limiting and authentication before requests reach Node.js services.",
      "OpenAPI/Swagger documentation is auto-generated from Express route definitions for developer portals."
    ]
  },
  {
    id: "nodejs-11",
    title: "Environment Variables & Configuration",
    topics: ["process.env", "dotenv Package", "Config Management", "Secrets Handling", "NODE_ENV"],
    difficulty: "Beginner",
    summary: "Environment variables store configuration outside your code — database URLs, API keys, ports, and feature flags. The dotenv package loads variables from a .env file into process.env. NODE_ENV distinguishes between development, staging, and production environments. Secrets should never be committed to version control; use .env files locally and secret managers in production.",
    common_mistakes: [
      "Committing .env files to Git — always add .env to .gitignore.",
      "Hardcoding sensitive credentials like API keys and database passwords directly in source code.",
      "Not setting NODE_ENV in production — many libraries (Express) use it to enable optimizations.",
      "Using process.env values without validation — a missing variable causes cryptic runtime errors.",
      "Creating a single .env file for all environments instead of using .env.development, .env.production, etc."
    ],
    interview_questions: [
      "Why should you use environment variables instead of hardcoding configuration?",
      "How does the dotenv package work?",
      "What is NODE_ENV and how does it affect application behavior?",
      "How do you manage secrets in a production environment?",
      "How would you validate that all required environment variables are set at startup?"
    ],
    real_world_usage: [
      "Cloud platforms (Heroku, AWS, Vercel) inject environment variables at deployment time.",
      "Docker containers use ENV directives and docker-compose environment blocks for configuration.",
      "CI/CD pipelines store secrets as encrypted environment variables (GitHub Secrets, GitLab CI Variables).",
      "Feature flags controlled via environment variables enable gradual rollouts without code changes."
    ]
  },
  {
    id: "nodejs-12",
    title: "Child Processes & Worker Threads",
    topics: ["child_process.exec", "child_process.spawn", "Worker Threads", "Cluster Module", "CPU-Intensive Tasks"],
    difficulty: "Advanced",
    summary: "Node.js is single-threaded, but it provides mechanisms to leverage multiple cores. Child processes (exec, spawn, fork) run separate OS processes for tasks like running shell commands or spawning Node scripts. Worker Threads share memory and run JavaScript in parallel threads — ideal for CPU-heavy computations. The Cluster module forks multiple instances of the app across CPU cores for load distribution.",
    common_mistakes: [
      "Using exec() for long-running processes — it buffers all output in memory. Use spawn() with streams instead.",
      "Confusing child processes with worker threads — child processes are separate OS processes with their own memory.",
      "Not handling the 'exit' and 'error' events on child processes — zombie processes accumulate.",
      "Using worker threads for I/O-bound tasks — the event loop already handles I/O efficiently; workers are for CPU tasks.",
      "Not using the cluster module in production — a single process cannot utilize all CPU cores."
    ],
    interview_questions: [
      "What is the difference between child_process.exec() and child_process.spawn()?",
      "When would you use Worker Threads vs Child Processes?",
      "How does the Cluster module help in scaling Node.js applications?",
      "How do Worker Threads communicate with the main thread?",
      "What is the difference between fork() and spawn()?"
    ],
    real_world_usage: [
      "Image processing services use worker threads to resize/compress images without blocking the event loop.",
      "PM2 (process manager) uses the cluster module to run Node.js apps across all CPU cores in production.",
      "Build tools like esbuild spawn child processes to parallelize compilation tasks.",
      "Video transcoding services fork separate processes for each transcoding job to isolate failures."
    ]
  }
];

export default nodejsLectures;
