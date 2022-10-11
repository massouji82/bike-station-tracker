import axios, {AxiosError, AxiosResponse} from 'axios';
import { useCallback, useEffect, useState } from 'react';
import findNearest from 'geolib/es/findNearest';

import LoadingIndicator from "../LoadingIndicator";
import StationCard from './StationCard';
import './StationLocator.css';
import { ReactComponent as SearchIcon } from '../assets/search.svg';
import cityBikeLogo from '../assets/oslo-city-bike.png';

interface BikeStations {
  station_id?: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

interface Availability {
  num_bikes_available: number;
  num_docks_available: number;
  station_id?: string;
}

export interface Merged extends BikeStations, Availability {
  currentLocationPosition: {
    currentLatitude: number,
    currentLongitude: number
  }
}

const defaultStations: BikeStations[] = [];
const defaultAvailability: Availability[] = [];
const defaultMergedArray: Merged[] = [];

const StationLocator = () => {
  const numItemsToShow = 20;
  const [bikeStations, setBikeStations] = useState(defaultStations);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [mergedArray, setMergedArray] = useState(defaultMergedArray);
  const [filteredResults, setFilteredResults] = useState<Merged[]>([]);
  const [nearestStation, setNearestStation] = useState<Merged[]>([]);
  const [numItemsShown, setNumItemsShown] = useState(numItemsToShow);
  const [fetching, setFetching] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState("");
  const [currentLocationPosition, setCurrentLocationPosition] = useState({
    currentLatitude: 0,
    currentLongitude: 0
  });
  const [stationLatLon, setStationLatLon] = useState([{
    latitude: 0,
    longitude: 0
  }]);

  const showAllStations = () => {
    setNearestStation([]);
    setSearchInput("");
    setNumItemsShown(numItemsToShow);
  }

  const showMore = () => {
    if (numItemsShown + numItemsToShow <= mergedArray.length) {
      setNumItemsShown(numItemsShown + numItemsToShow);
    } else {
      setNumItemsShown(mergedArray.length);
    }
  }

  const findNearestStation = () => {
    const nearestLatLon = findNearest({
      latitude: currentLocationPosition.currentLatitude,
      longitude: currentLocationPosition.currentLongitude
    }, stationLatLon);

    setNearestStation(mergedArray.filter(station =>
      station.lat === (nearestLatLon as any).latitude && station.lon === (nearestLatLon as any).longitude)
    );

    setSearchInput("");
  }

  const mergeArrays = useCallback(
    () => {
      setMergedArray((bikeStations as Merged[])
        .map(station => (
          { ...station, ...availability.find(element => element.station_id === station.station_id) }
        ))
      );
    }, [availability, bikeStations]
  )

  const fetchData = useCallback(
    async () => {
      const headers = {
        "Client-Identifier": "mass-codingAssignment"
      }

      try {
        const bikeStationResult = await axios
          .get<AxiosResponse>("https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json",
            { headers: headers });
        const availabilityResult = await axios
          .get<AxiosResponse>("https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json",
            { headers: headers });
        setBikeStations(bikeStationResult.data.data.stations);
        setAvailability(availabilityResult.data.data.stations);
        setStationLatLon(bikeStationResult.data.data.stations.map((station: BikeStations) => (
          { latitude: station.lat, longitude: station.lon }
        )));
      } catch (error) {
        const err = error as AxiosError;
        setError(err.message);
      }
      setFetching(false);
    }, []
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser!");
    } else {
      navigator.geolocation.getCurrentPosition(position => {
        setCurrentLocationPosition({
          currentLatitude: position.coords.latitude,
          currentLongitude: position.coords.longitude
        });
      });
    }
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);

    const filteredArray = mergedArray.filter(element => {
      return Object
        .values(element)
        .join(' ')
        .toLowerCase()
        .includes(event.target.value.toLowerCase());
    });

    setFilteredResults(filteredArray);
  }

  const returnStations = (stationArray: Merged[]) => {
    return stationArray.map((station, index) => {
      return (
        <StationCard
          key={index}
          name={station.name}
          address={station.address}
          num_bikes_available={station.num_bikes_available}
          num_docks_available={station.num_docks_available}
          lat={station.lat}
          lon={station.lon}
          currentLocationPosition={currentLocationPosition}
        />
      )}
    )
  }

  useEffect(() => {
    fetchData()
      .catch(console.error);
  }, [fetchData]);

  useEffect(() => {
    mergeArrays();
  }, [mergeArrays]);

  return (
    <>
      <h1 className='header-container'>
        Welcome to
        <img className='rounded-md py-4 w-64 sm:w-96' src={cityBikeLogo} alt={"Oslo city bike"} />
        station finder
      </h1>

      {fetching ?
        <div className="flex justify-center pt-20">
          <LoadingIndicator />
        </div>
        :
        <>
          <div className='search-container'>
            <div className='relative'>
              <div className='search-icon-wrapper'>
                <SearchIcon className='search-icon' />
              </div>

              <input type="text" placeholder='Search' className="input" value={searchInput}
                onChange={handleSearch}
              />
            </div>

            {nearestStation.length ?
              <button className='button' onClick={showAllStations}>
                Show all stations
              </button> :
              <button className='button disabled:disabled-style' onClick={findNearestStation}
                disabled={currentLocationPosition.currentLatitude === 0}>
                {currentLocationPosition.currentLatitude === 0 ?
                  "Loading nearest station ..." : "Show me the nearest station"
                }
              </button>}
          </div>

          <div className='wrapper'>
            {nearestStation.length ?
              returnStations(nearestStation) :
              <>
                {searchInput.length ?
                  returnStations(filteredResults) :
                  returnStations(mergedArray.slice(0, numItemsShown))
                }
              </>
            }
          </div>

          {!searchInput.length && !nearestStation.length && (numItemsShown + numItemsToShow <= mergedArray.length)
            && <div className='flex justify-center pb-4'>
              <button className='show-more' onClick={showMore}>
                Show more
              </button>
            </div>
          }
        </>
      }

      {error &&
        <p className='error' role="alert">
          <span className="font-medium">Danger alert!</span> {error}
        </p>
      }
    </>
  )
}

export default StationLocator