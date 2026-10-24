require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Note = require('./models/Note');

const inDays = n => new Date(Date.now() + n * 864e5);

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notenest');
  await Note.deleteMany({});
  await Subject.deleteMany({});
  await User.deleteMany({ email: 'demo@notenest.com' });

  const user = await User.create({
    name: 'Demo Student',
    email: 'demo@notenest.com',
    password: await bcrypt.hash('demo123', 10)
  });

  const subjectData = [
    { name: 'Artificial Intelligence', color: '#6366f1', examDate: inDays(5) },
    { name: 'Machine Learning', color: '#ec4899', examDate: inDays(9) },
    { name: 'Data Structures', color: '#10b981', examDate: inDays(12) },
    { name: 'DBMS', color: '#f59e0b', examDate: inDays(15) },
    { name: 'Operating Systems', color: '#06b6d4', examDate: inDays(18) },
    { name: 'Computer Networks', color: '#ef4444' },
    { name: 'Engineering Maths', color: '#8b5cf6' }
  ].map(s => ({ ...s, user: user._id }));
  const created = await Subject.insertMany(subjectData);
  const id = name => created.find(s => s.name === name)._id;

  const notes = [
    { title: 'Search Algorithms in AI', topic: 'Problem Solving', subject: id('Artificial Intelligence'), pinned: true,
      content: 'BFS: shortest path, uses queue.\nDFS: uses stack, low memory.\nA*: f(n) = g(n) + h(n), optimal if h is admissible.' },
    { title: 'Intelligent Agents', topic: 'Fundamentals', subject: id('Artificial Intelligence'), favorite: true,
      content: 'Types: simple reflex, model-based, goal-based, utility-based, learning agent.\nPEAS: Performance, Environment, Actuators, Sensors.' },
    { title: 'Supervised vs Unsupervised Learning', topic: 'Basics', subject: id('Machine Learning'), pinned: true, favorite: true,
      content: 'Supervised: labeled data (regression, classification).\nUnsupervised: no labels (clustering, PCA).\nReinforcement: reward-based learning.' },
    { title: 'Overfitting and Regularization', topic: 'Model Training', subject: id('Machine Learning'),
      content: 'Overfitting: great on train data, poor on test data.\nFixes: more data, L1/L2 regularization, dropout, early stopping, cross-validation.' },
    { title: 'Neural Network Basics', topic: 'Deep Learning', subject: id('Machine Learning'), favorite: true,
      content: 'Layers: input, hidden, output.\nActivations: ReLU, sigmoid, softmax.\nTraining: forward pass, loss, backpropagation, gradient descent.' },
    { title: 'Time Complexity Cheat Sheet', topic: 'Analysis', subject: id('Data Structures'), pinned: true,
      content: 'Array access O(1)\nBinary search O(log n)\nMerge sort O(n log n)\nBubble sort O(n^2)\nHash table lookup O(1) average' },
    { title: 'Trees and Graph Traversals', topic: 'Trees', subject: id('Data Structures'),
      content: 'Inorder: Left, Root, Right.\nPreorder: Root, Left, Right.\nPostorder: Left, Right, Root.\nBST: left < root < right.' },
    { title: 'Normalization Forms', topic: 'Database Design', subject: id('DBMS'),
      content: '1NF: atomic values.\n2NF: no partial dependency.\n3NF: no transitive dependency.\nBCNF: every determinant is a candidate key.' },
    { title: 'ACID Properties', topic: 'Transactions', subject: id('DBMS'), favorite: true,
      content: 'Atomicity, Consistency, Isolation, Durability.' },
    { title: 'CPU Scheduling Algorithms', topic: 'Processes', subject: id('Operating Systems'),
      content: 'FCFS, SJF, Round Robin (time quantum), Priority scheduling.\nWaiting time = turnaround time - burst time.' },
    { title: 'Deadlock Conditions', topic: 'Synchronization', subject: id('Operating Systems'),
      content: 'Mutual exclusion, hold and wait, no preemption, circular wait. All four must hold.' },
    { title: 'OSI Model Layers', topic: 'Fundamentals', subject: id('Computer Networks'),
      content: '7 Application, 6 Presentation, 5 Session, 4 Transport, 3 Network, 2 Data Link, 1 Physical.' },
    { title: 'Matrix Rank and Eigenvalues', topic: 'Linear Algebra', subject: id('Engineering Maths'),
      content: 'Characteristic equation: det(A - lambda I) = 0.\nSum of eigenvalues = trace. Product = determinant.' }
  ].map(n => ({ ...n, user: user._id }));
  await Note.insertMany(notes);

  console.log(`Seeded ${created.length} subjects and ${notes.length} notes`);
  console.log('Demo login -> email: demo@notenest.com  password: demo123');
}

run()
  .catch(err => { console.error('Seed failed:', err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
