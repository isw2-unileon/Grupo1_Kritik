import { useEffect, useState } from 'react'

export default function App() {

  // Estado para guardar el mensaje de la API
  const [message, setMessage] = useState<string>("Loading...")
  const API_URL = "https://grupo1-kritik-backend.onrender.com/";

  useEffect(() => {
    const fetchHello = async () => {
      try {
        const response = await fetch(`${API_URL}/api/hello`);
        const data = await response.json()
        setMessage(data.message || "No message found")
      } catch (error) {
        console.error("Error fetching API:", error)
        setMessage("Error connecting to backend")
      }
    }

    fetchHello()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">App</h1>
        <p className="text-gray-500">
          Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.tsx</code> to get start.
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Backend Response:</p>
        <p className="text-xl font-mono text-gray-800 italic">
          "{message}"
        </p>
      </div>
    </main>
  );
}
