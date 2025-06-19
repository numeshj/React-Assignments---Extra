import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Navigate, useNavigate } from 'react-router-dom'

function App() {
  const navigate =useNavigate()

  return (
    <div className="asg-btn-container">
      <button className="asg-btn" onClick={()=> navigate('/asg-1')}>ASG_1</button>
      <button className="asg-btn" onClick={()=> navigate('/asg-2')}>ASG_2</button>
      <button className="asg-btn" onClick={()=> navigate('/asg-3')}>ASG_3</button>
      <button className="asg-btn" onClick={()=> navigate('/asg-9')}>ASG_9</button>
    </div>

  )
}

export default App
