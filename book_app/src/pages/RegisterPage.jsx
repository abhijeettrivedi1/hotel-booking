import { useState,useContext } from "react"
import { Link } from "react-router-dom"
import { Usercontext } from "../usercontext.jsx"
import axios from "axios"
import {  Navigate } from "react-router-dom"

export default function RegisterPage(){
    const [name,setName]=useState("")
    const [email,setEmail]=useState("")
    const [password,setPassword]=useState("")
    const {setUser}=useContext(Usercontext)
    const[redirect,setRedirect]=useState(false)
    async function registerUser(e){
        e.preventDefault()
        try{
            const userinfo=await axios.post("/register",{
                name,
                email,
                password
            });
            // console.log(userinfo)
            setUser(userinfo.data)
            alert("User registration successful")
            setRedirect(true)
        }catch{
            alert("User registration failed")
        }
        
    }
    if(redirect==true){
            return <Navigate to={"/"}/>
    }
    return(
        <div className="mt-4 grow flex items-center justify-around">
            <div className="mb-64">
                <h1 className="text-4xl text-center mb-4">Register</h1>
                <form action="" onSubmit={registerUser}className="max-w-md mx-auto ">
                    <input type="text" placeholder="Abhijeet Trivedi" 
                    value={name} 
                    onChange={e=>setName(e.target.value)}/>
                    <input type="email" placeholder="your@email" 
                    value={email}
                    onChange={e=>setEmail(e.target.value)}/>
                    <input type="password" placeholder="password" 
                    value={password}
                    onChange={e=>setPassword(e.target.value)}/>
                    <button className="primary">Register</button>
                    <div className="text-center py-2 text-gray-500">
                        Already a member?  
                        <Link to={"/login"} className="underline text-red-600" >Login</Link>
                    </div>
                </form>
            </div>
            
        </div>
    )
}