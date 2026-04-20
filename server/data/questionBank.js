/**
 * Question bank for randomized interview sessions.
 * Each question is tagged with: type, difficulty, topic, language, starterCode.
 * Roles: frontend, backend, fullstack, dsa, hr
 */

const questionBank = {
  // ════════════════════════════════════════
  //  FRONTEND
  // ════════════════════════════════════════
  frontend: [
    // ── Text ──
    { text: 'Explain the virtual DOM in React and how it improves performance.', type: 'text', difficulty: 'easy', topic: 'React', language: 'none', starterCode: null },
    { text: 'What is the difference between useEffect and useLayoutEffect? When would you use each?', type: 'text', difficulty: 'medium', topic: 'React Hooks', language: 'none', starterCode: null },
    { text: 'Describe how CSS specificity works. Give examples of increasing specificity.', type: 'text', difficulty: 'easy', topic: 'CSS', language: 'none', starterCode: null },
    { text: 'What are Web Vitals (LCP, FID, CLS)? How would you optimize each?', type: 'text', difficulty: 'hard', topic: 'Performance', language: 'none', starterCode: null },
    { text: 'Explain the concept of closures in JavaScript with a practical example.', type: 'text', difficulty: 'medium', topic: 'JavaScript', language: 'none', starterCode: null },
    { text: 'What is the event loop in JavaScript? How do microtasks differ from macrotasks?', type: 'text', difficulty: 'hard', topic: 'JavaScript', language: 'none', starterCode: null },
    { text: 'Compare server-side rendering (SSR) vs client-side rendering (CSR). What are trade-offs?', type: 'text', difficulty: 'medium', topic: 'Architecture', language: 'none', starterCode: null },
    // ── Coding ──
    { text: 'Write a debounce function that delays invoking a callback until after a given number of milliseconds have elapsed since the last invocation.', type: 'coding', difficulty: 'medium', topic: 'JavaScript', language: 'javascript', starterCode: null },
    { text: 'Write a function that deep-clones a JavaScript object without using JSON.parse/JSON.stringify. Handle nested objects and arrays.', type: 'coding', difficulty: 'hard', topic: 'JavaScript', language: 'javascript', starterCode: null },
    { text: 'Write a function `flattenArray` that takes a deeply nested array and returns a flat array. Example: [[1,[2]],3] → [1,2,3].', type: 'coding', difficulty: 'medium', topic: 'JavaScript', language: 'javascript', starterCode: null },
    { text: 'Write a React custom hook `useLocalStorage(key, initialValue)` that syncs state with localStorage.', type: 'coding', difficulty: 'medium', topic: 'React Hooks', language: 'javascript', starterCode: null },
    { text: 'Write a function that takes an array of numbers and returns the sum of all even numbers in the array.', type: 'coding', difficulty: 'easy', topic: 'JavaScript', language: 'javascript', starterCode: null },
    // ── Bugfix ──
    { text: 'This React component should toggle a boolean state on button click, but it has bugs. Fix them.', type: 'bugfix', difficulty: 'easy', topic: 'React', language: 'javascript', starterCode: 'import React from "react";\n\nfunction Toggle() {\n  let isOn = false;\n\n  const handleClick = () => {\n    isOn = !isOn;\n  };\n\n  return (\n    <div>\n      <p>Status: {isOn ? "ON" : "OFF"}</p>\n      <button onclick={handleClick}>Toggle</button>\n    </div>\n  );\n}' },
    { text: 'This function is supposed to reverse a string, but it has bugs. Find and fix all the issues.', type: 'bugfix', difficulty: 'easy', topic: 'JavaScript', language: 'javascript', starterCode: 'function reverseString(str) {\n  let reversed = "";\n  for (let i = str.length; i >= 0; i--) {\n    reversed += str[i];\n  }\n  return reversed;\n}' },
    { text: 'This useEffect is causing an infinite re-render loop. Find and fix the issue.', type: 'bugfix', difficulty: 'medium', topic: 'React Hooks', language: 'javascript', starterCode: 'import { useState, useEffect } from "react";\n\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetch("/api/users")\n      .then(res => res.json())\n      .then(data => setUsers(data));\n  });\n\n  return (\n    <ul>\n      {users.map(u => <li key={u.id}>{u.name}</li>)}\n    </ul>\n  );\n}' },
    { text: 'This Promise.all usage has a bug that causes unhandled rejections. Fix it.', type: 'bugfix', difficulty: 'hard', topic: 'JavaScript', language: 'javascript', starterCode: 'async function fetchAll(urls) {\n  const results = [];\n  const promises = urls.map(url => fetch(url));\n  \n  Promise.all(promises).then(responses => {\n    responses.forEach(res => {\n      results.push(res.json());\n    });\n  });\n  \n  return results;\n}' },
  ],

  // ════════════════════════════════════════
  //  BACKEND
  // ════════════════════════════════════════
  backend: [
    { text: 'Explain the differences between SQL and NoSQL databases. When would you choose each?', type: 'text', difficulty: 'easy', topic: 'Databases', language: 'none', starterCode: null },
    { text: 'What is the N+1 query problem? How do you solve it?', type: 'text', difficulty: 'medium', topic: 'Databases', language: 'none', starterCode: null },
    { text: 'Describe RESTful API design best practices. What makes a good REST API?', type: 'text', difficulty: 'easy', topic: 'API Design', language: 'none', starterCode: null },
    { text: 'Explain JWT authentication flow. What are the security considerations?', type: 'text', difficulty: 'medium', topic: 'Authentication', language: 'none', starterCode: null },
    { text: 'What are database indexes? How do they improve query performance and what are the trade-offs?', type: 'text', difficulty: 'hard', topic: 'Databases', language: 'none', starterCode: null },
    { text: 'What is rate limiting? Describe different strategies to implement it in a Node.js API.', type: 'text', difficulty: 'medium', topic: 'Security', language: 'none', starterCode: null },
    { text: 'Explain microservices architecture vs monolithic. What are the trade-offs?', type: 'text', difficulty: 'hard', topic: 'Architecture', language: 'none', starterCode: null },
    { text: 'Write an Express middleware that logs request method, URL, status code, and response time.', type: 'coding', difficulty: 'easy', topic: 'Express', language: 'javascript', starterCode: null },
    { text: 'Write a function that implements a basic in-memory LRU cache with get(key) and put(key, value) methods. Capacity should be configurable.', type: 'coding', difficulty: 'hard', topic: 'Data Structures', language: 'javascript', starterCode: null },
    { text: 'Write an async function that retries a given async operation up to N times with exponential backoff.', type: 'coding', difficulty: 'medium', topic: 'Node.js', language: 'javascript', starterCode: null },
    { text: 'Write a pagination helper that returns { data, page, totalPages, hasNext, hasPrev } given an array, page number, and page size.', type: 'coding', difficulty: 'easy', topic: 'Utilities', language: 'javascript', starterCode: null },
    { text: 'Write a function to validate an email address without using regex.', type: 'coding', difficulty: 'medium', topic: 'Validation', language: 'javascript', starterCode: null },
    { text: 'This Express route handler has a security vulnerability and a logic bug. Find and fix them.', type: 'bugfix', difficulty: 'medium', topic: 'Express', language: 'javascript', starterCode: 'app.get("/api/users/:id", async (req, res) => {\n  const user = await User.findById(req.params.id);\n  res.json({ password: user.password, email: user.email, name: user.name });\n});' },
    { text: 'This async function should read files sequentially but has a bug. Fix it.', type: 'bugfix', difficulty: 'medium', topic: 'Node.js', language: 'javascript', starterCode: 'const fs = require("fs").promises;\n\nasync function readFiles(filePaths) {\n  const contents = [];\n  filePaths.forEach(async (path) => {\n    const data = await fs.readFile(path, "utf-8");\n    contents.push(data);\n  });\n  return contents;\n}' },
    { text: 'This MongoDB query has performance issues and a logic error. Fix it.', type: 'bugfix', difficulty: 'hard', topic: 'MongoDB', language: 'javascript', starterCode: 'async function getActiveUsers(minAge) {\n  const users = await User.find({});\n  const filtered = users.filter(u => u.age > minAge && u.status = "active");\n  return filtered;\n}' },
  ],

  // ════════════════════════════════════════
  //  FULLSTACK
  // ════════════════════════════════════════
  fullstack: [
    { text: 'Explain the complete lifecycle of an HTTP request from browser to server and back.', type: 'text', difficulty: 'medium', topic: 'Networking', language: 'none', starterCode: null },
    { text: 'What are WebSockets? How do they differ from HTTP? When would you use them?', type: 'text', difficulty: 'medium', topic: 'Networking', language: 'none', starterCode: null },
    { text: 'Explain CORS. Why does it exist and how do you configure it correctly?', type: 'text', difficulty: 'easy', topic: 'Security', language: 'none', starterCode: null },
    { text: 'What is optimistic UI updating? Describe how you would implement it with React and a REST API.', type: 'text', difficulty: 'hard', topic: 'UX Patterns', language: 'none', starterCode: null },
    { text: 'Describe a caching strategy for a full-stack application. Cover client, CDN, and server-side caching.', type: 'text', difficulty: 'hard', topic: 'Performance', language: 'none', starterCode: null },
    { text: 'What is the difference between authentication and authorization? Give real-world examples.', type: 'text', difficulty: 'easy', topic: 'Security', language: 'none', starterCode: null },
    { text: 'Explain database migrations. Why are they important and how do you manage them?', type: 'text', difficulty: 'medium', topic: 'Databases', language: 'none', starterCode: null },
    { text: 'Write a function that fetches data from an API with loading, error, and success states. Return an object with { data, error, loading }.', type: 'coding', difficulty: 'easy', topic: 'API Integration', language: 'javascript', starterCode: null },
    { text: 'Write a throttle function that ensures a callback is called at most once every N milliseconds.', type: 'coding', difficulty: 'medium', topic: 'JavaScript', language: 'javascript', starterCode: null },
    { text: 'Write a middleware chain executor: given an array of async middleware functions, execute them in order, each receiving (req, res, next).', type: 'coding', difficulty: 'hard', topic: 'Architecture', language: 'javascript', starterCode: null },
    { text: 'Write a function that converts a flat array of { id, parentId, name } objects into a nested tree structure.', type: 'coding', difficulty: 'hard', topic: 'Data Structures', language: 'javascript', starterCode: null },
    { text: 'Write a simple event emitter class with on(event, callback), off(event, callback), and emit(event, ...args) methods.', type: 'coding', difficulty: 'medium', topic: 'Design Patterns', language: 'javascript', starterCode: null },
    { text: 'This fetch wrapper has a bug that causes it to never reject on HTTP errors. Fix it.', type: 'bugfix', difficulty: 'easy', topic: 'API', language: 'javascript', starterCode: 'async function fetchJSON(url) {\n  const response = await fetch(url);\n  const data = await response.json();\n  return data;\n}' },
    { text: 'This form submit handler has race condition and state bugs. Fix them.', type: 'bugfix', difficulty: 'medium', topic: 'React', language: 'javascript', starterCode: 'function SubmitForm() {\n  const [loading, setLoading] = useState(false);\n  const [data, setData] = useState("");\n\n  const handleSubmit = async () => {\n    setLoading(true);\n    const res = fetch("/api/submit", {\n      method: "POST",\n      body: JSON.stringify({ data }),\n    });\n    setLoading(false);\n    setData("");\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input value={data} onChange={e => setData(e.target.value)} />\n      <button disabled={loading}>Submit</button>\n    </form>\n  );\n}' },
    { text: 'This authentication middleware passes even when the token is invalid. Fix the logic.', type: 'bugfix', difficulty: 'medium', topic: 'Auth', language: 'javascript', starterCode: 'const jwt = require("jsonwebtoken");\n\nfunction protect(req, res, next) {\n  const token = req.headers.authorization;\n  if (token) {\n    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n    req.user = decoded;\n  }\n  next();\n}' },
  ],

  // ════════════════════════════════════════
  //  DSA
  // ════════════════════════════════════════
  dsa: [
    { text: 'Explain the difference between a stack and a queue. Give real-world use cases for each.', type: 'text', difficulty: 'easy', topic: 'Data Structures', language: 'none', starterCode: null },
    { text: 'What is Big O notation? Explain O(1), O(n), O(log n), and O(n²) with examples.', type: 'text', difficulty: 'easy', topic: 'Complexity', language: 'none', starterCode: null },
    { text: 'Explain the difference between BFS and DFS. When would you use each?', type: 'text', difficulty: 'medium', topic: 'Graph Algorithms', language: 'none', starterCode: null },
    { text: 'What is dynamic programming? Explain memoization vs tabulation with an example.', type: 'text', difficulty: 'hard', topic: 'DP', language: 'none', starterCode: null },
    { text: 'What is a hash collision? How do hash maps handle collisions?', type: 'text', difficulty: 'medium', topic: 'Hash Maps', language: 'none', starterCode: null },
    { text: 'Explain the time complexity of common sorting algorithms (merge sort, quick sort, bubble sort).', type: 'text', difficulty: 'medium', topic: 'Sorting', language: 'none', starterCode: null },
    { text: 'Write a function to check if a string has all unique characters without using extra data structures.', type: 'coding', difficulty: 'easy', topic: 'Strings', language: 'javascript', starterCode: null },
    { text: 'Write a function `twoSum(nums, target)` that returns the indices of two numbers that add up to the target.', type: 'coding', difficulty: 'easy', topic: 'Arrays', language: 'javascript', starterCode: null },
    { text: 'Write a function to check if a given string is a valid palindrome, considering only alphanumeric characters.', type: 'coding', difficulty: 'easy', topic: 'Strings', language: 'javascript', starterCode: null },
    { text: 'Write a function that finds the longest substring without repeating characters.', type: 'coding', difficulty: 'medium', topic: 'Sliding Window', language: 'javascript', starterCode: null },
    { text: 'Write a function that merges two sorted arrays into one sorted array without using .sort().', type: 'coding', difficulty: 'medium', topic: 'Arrays', language: 'javascript', starterCode: null },
    { text: 'Implement binary search on a sorted array. Return the index of the target or -1.', type: 'coding', difficulty: 'easy', topic: 'Search', language: 'javascript', starterCode: null },
    { text: 'Write a function that computes the nth Fibonacci number using dynamic programming (not recursion).', type: 'coding', difficulty: 'medium', topic: 'DP', language: 'javascript', starterCode: null },
    { text: 'This binary search implementation has an off-by-one error and an infinite loop bug. Fix it.', type: 'bugfix', difficulty: 'medium', topic: 'Search', language: 'javascript', starterCode: 'function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length;\n\n  while (left < right) {\n    const mid = (left + right) / 2;\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid;\n    else right = mid;\n  }\n  return -1;\n}' },
    { text: 'This linked list reversal function has a bug. Fix it.', type: 'bugfix', difficulty: 'medium', topic: 'Linked Lists', language: 'javascript', starterCode: 'function reverseList(head) {\n  let prev = null;\n  let current = head;\n  while (current) {\n    current.next = prev;\n    prev = current;\n    current = current.next;\n  }\n  return prev;\n}' },
    { text: 'This merge sort implementation produces incorrect output. Fix the bug.', type: 'bugfix', difficulty: 'hard', topic: 'Sorting', language: 'javascript', starterCode: 'function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}\n\nfunction merge(left, right) {\n  const result = [];\n  while (left.length && right.length) {\n    if (left[0] < right[0]) result.push(left.shift());\n    else result.push(left.shift());\n  }\n  return result;\n}' },
  ],

  // ════════════════════════════════════════
  //  HR / BEHAVIORAL
  // ════════════════════════════════════════
  hr: [
    { text: 'Tell me about yourself and your professional background.', type: 'text', difficulty: 'easy', topic: 'Introduction', language: 'none', starterCode: null },
    { text: 'Describe a time you had a conflict with a teammate. How did you resolve it?', type: 'text', difficulty: 'medium', topic: 'Conflict Resolution', language: 'none', starterCode: null },
    { text: 'What is your greatest professional strength and how has it helped you succeed?', type: 'text', difficulty: 'easy', topic: 'Self-Assessment', language: 'none', starterCode: null },
    { text: 'Tell me about a project that failed. What did you learn from it?', type: 'text', difficulty: 'medium', topic: 'Failure', language: 'none', starterCode: null },
    { text: 'How do you prioritize tasks when you have multiple deadlines?', type: 'text', difficulty: 'easy', topic: 'Time Management', language: 'none', starterCode: null },
    { text: 'Describe a situation where you had to learn a new technology quickly. How did you approach it?', type: 'text', difficulty: 'medium', topic: 'Learning', language: 'none', starterCode: null },
    { text: 'Where do you see yourself in 5 years? How does this role fit into your plan?', type: 'text', difficulty: 'easy', topic: 'Career Goals', language: 'none', starterCode: null },
    { text: 'Tell me about a time you went above and beyond for a project or client.', type: 'text', difficulty: 'medium', topic: 'Initiative', language: 'none', starterCode: null },
    { text: 'How do you handle receiving critical feedback from a manager?', type: 'text', difficulty: 'medium', topic: 'Feedback', language: 'none', starterCode: null },
    { text: 'Describe a time when you had to make a decision with incomplete information.', type: 'text', difficulty: 'hard', topic: 'Decision Making', language: 'none', starterCode: null },
    { text: 'What motivates you in your work? Give a specific example.', type: 'text', difficulty: 'easy', topic: 'Motivation', language: 'none', starterCode: null },
    { text: 'Tell me about the most complex project you have worked on. What was your role?', type: 'text', difficulty: 'hard', topic: 'Experience', language: 'none', starterCode: null },
    { text: 'How do you handle working with someone whose work style is very different from yours?', type: 'text', difficulty: 'medium', topic: 'Teamwork', language: 'none', starterCode: null },
    { text: 'Describe a situation where you had to persuade others to adopt your idea.', type: 'text', difficulty: 'hard', topic: 'Leadership', language: 'none', starterCode: null },
    { text: 'What is one area you are actively working on improving?', type: 'text', difficulty: 'easy', topic: 'Self-Improvement', language: 'none', starterCode: null },
  ],
};

/**
 * Fisher-Yates shuffle (in-place).
 */
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Select questions for a session.
 * @param {string} role - frontend | backend | fullstack | dsa | hr
 * @param {string} difficulty - Easy | Medium | Hard
 * @param {string[]} excludeTexts - previously seen question texts to exclude
 * @param {number} count - number of questions to pick (default 5)
 */
const selectQuestions = (role, difficulty, excludeTexts = [], count = 5) => {
  const pool = questionBank[role] || questionBank.fullstack;

  // Filter out previously seen questions
  let available = pool.filter(q => !excludeTexts.includes(q.text));

  // If too few remain after exclusion, add back from full pool
  if (available.length < count) {
    available = [...pool];
  }

  // Bias toward selected difficulty but include mix
  const diffMap = { 'Easy': 'easy', 'Medium': 'medium', 'Hard': 'hard' };
  const targetDiff = diffMap[difficulty] || 'medium';

  const primary = available.filter(q => q.difficulty === targetDiff);
  const secondary = available.filter(q => q.difficulty !== targetDiff);

  // Take majority from target difficulty, rest from others
  const primaryCount = Math.min(Math.ceil(count * 0.6), primary.length);
  const secondaryCount = count - primaryCount;

  const selected = [
    ...shuffleArray(primary).slice(0, primaryCount),
    ...shuffleArray(secondary).slice(0, secondaryCount),
  ];

  // Shuffle final selection and return exactly `count`
  return shuffleArray(selected).slice(0, count);
};

module.exports = { questionBank, shuffleArray, selectQuestions };
