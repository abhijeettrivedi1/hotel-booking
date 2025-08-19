// src/components/Placepade.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BookingWidget from "../Bookingwidget";
import Placegallery from "../Placegallery";
import Addresslink from "../Addresslink";
import { Usercontext } from "../usercontext.jsx";

export default function Placepade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useContext(Usercontext);

  const [place, setPlace] = useState(null);
  const [owner,SetOwner]=useState("");
  // console.log(place);
  useEffect(() => {
    if (!id) return;
    axios.get(`/places/${id}`).then((response) => {
      setPlace(response.data);
      SetOwner(response.data.owner);
    });
  }, [id]);

  if (!place) return "";

  const handleTalkToOwner = () => {
    if (!ready) return; // still loading
    if (!user) {
      // if not logged in, send to login page (adjust path if your app uses a different route)
      return navigate("/login");
    }
    // navigate to chat page with placeId and senderId (user._id)

    navigate(`/chat/${owner}`);
  };

  return (
    <div className="mt-4 bg-gray-100 -mx-8 px-8 pt-8 relative">
      <h1 className="text-3xl">{place.title}</h1>

      <div className="mt-2">
        <button
          onClick={handleTalkToOwner}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Talk to owner
        </button>
      </div>

      <Addresslink>{place.address}</Addresslink>
      <Placegallery place={place} />

      <div className="mt-8 mb-8 grid gap-8 grid-cols-1 md:grid-cols-[2fr_1fr]">
        <div>
          <div className="my-4">
            <h2 className="font-semibold text-2xl">Description</h2>
            {place.description}
          </div>
          Check-in: {place.checkIn} <br />
          Check-out: {place.checkOut} <br />
          Max number of guests: {place.maxGuests}
        </div>

        <div>
          <BookingWidget place={place} />
        </div>
      </div>

      <div className="bg-white -mx-8 px-8 py-8 border-t">
        <div>
          <h2 className="font-semibold text-2xl">Extra Info</h2>
        </div>
        <div className="mb-4 mt-2 text-sm text-gray-700 leading-5">
          {place.extraInfo}
        </div>
      </div>
    </div>
  );
}
