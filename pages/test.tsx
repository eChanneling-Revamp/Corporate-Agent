import { useState } from 'react'

export default function Test() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Page</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}