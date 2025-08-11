import React, { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState<{ text: string; done: boolean }[]>([
    { text: 'yhyhu', done: true }
  ]);
  const [input, setInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setTodos([{ text: input.trim(), done: false }, ...todos]);
      setInput('');
    }
  };

  const toggleDone = (idx: number) => {
    setTodos(todos =>
      todos.map((todo, i) => (i === idx ? { ...todo, done: !todo.done } : todo))
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow max-h-screen">
      <h3 className="text-base font-medium text-gray-700 mb-2">To-Do List</h3>
      <form onSubmit={handleAdd}>
        <input
          className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"
          placeholder="Enter your task here"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </form>
      <div className="space-y-2">
        {todos.map((todo, idx) => (
          <div
            key={idx}
            className="flex items-center bg-gray-50 rounded px-3 py-2"
          >
            <button
              className="mr-2"
              onClick={() => toggleDone(idx)}
              aria-label={todo.done ? 'Mark as not done' : 'Mark as done'}
            >
              <span
                className={`inline-block w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  todo.done
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {todo.done ? '✔' : ''}
              </span>
            </button>
            <span
              className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}
            >
              {todo.text}
            </span>
            <button
              className="ml-2 text-gray-400 hover:text-red-500"
              onClick={() => setTodos(todos => todos.filter((_, i) => i !== idx))}
              aria-label="Delete"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#e5e7eb"/>
                <rect x="9" y="11" width="6" height="2" rx="1" fill="#6b7280"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}