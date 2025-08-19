import { Link } from "react-router-dom";
import Header from "../Header";
import { useEffect, useState } from "react";
import axios from "axios";

export default function IndexPage(){
    const [places,setPlaces]=useState([])
    useEffect(()=>{
        axios.get("/places").then(response=>{
            setPlaces(response.data)
            
        })
    },[])
    return(
        <div className="mt-8 gap-x-6 gap-y-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {places.length>0 && places.map(place=>{
                return(
                    <Link to={`/place/${place._id}`} className="block transform transition duration-300 hover:scale-105">
    <div className="relative bg-gray-200 mb-4 rounded-xl overflow-hidden shadow-md hover:shadow-xl">
        {place.photos?.[0] && (
            <img
                className="w-full h-48 object-cover"
                src={place.photos?.[0]}
                alt={place.title}
            />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
            <h2 className="text-white font-semibold text-lg truncate">{place.address}</h2>
            <h3 className="text-gray-300 text-sm truncate">{place.title}</h3>
        </div>
    </div>
    <div className="flex justify-between items-center mt-2">
        <div>
            <h2 className="text-gray-800 font-bold text-lg">{place.address}</h2>
            <h3 className="text-gray-500 text-sm">{place.title}</h3>
        </div>
        <div className="text-right">
            <span className="text-black-600 font-bold text-lg">${place.price}</span>
            <span className="text-gray-600"> / night</span>
        </div>
    </div>
</Link>
                
                
                )
                
            
            })
            
        }
        </div>
    );
}