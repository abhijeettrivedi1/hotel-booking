
import { Route,Routes } from 'react-router-dom'
import './App.css'
import IndexPage from './pages/IndexPage'
import LoginPage from './pages/LoginPage'
import Layout from './Layout'
import RegisterPage from './pages/RegisterPage'
import axios from 'axios'
import { Usercontextprovider } from './usercontext'
import ProfilePage from './pages/ProfilePage'
import PlacesPage from './pages/PlacesPage'
import PlacesFormPage from './pages/PlacesFormPage'
import Placepage from './pages/Placepage' 
import BookingPage from './pages/BookingPageSingular'
import BookingsPage from './pages/BookingsPage'
axios.defaults.baseURL=import.meta.env.VITE_API_BASE_URL
axios.defaults.withCredentials=true
function App() {
  return (
    <Usercontextprovider>
      <Routes>
        <Route path='/' element={<Layout/>}>
          <Route index element={<IndexPage />} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/register" element={<RegisterPage/>} />
          <Route path="/account" element={<ProfilePage/>}/>
          <Route path="/account/places" element={<PlacesPage/>}/>
          <Route path="/account/places/new" element={<PlacesFormPage/>}/>
          <Route path="/account/places/:id" element={<PlacesFormPage/>}/>
          <Route path="place/:id" element={<Placepage/>}/>
          <Route path="/account/bookings" element={<BookingsPage/>}/>
          <Route path="/account/booking/:id" element={<BookingPage/>}/>
         </Route>
        
      </Routes>
    </Usercontextprovider>
    
  )
}

export default App
