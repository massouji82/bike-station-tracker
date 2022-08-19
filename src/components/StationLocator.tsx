import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import findNearest from 'geolib/es/findNearest';
import LoadingIndicator from "../LoadingIndicator";
import StationCard from './StationCard';
import './StationLocator.css';
import { ReactComponent as SearchIcon } from '../assets/search.svg';
import cityBikeLogo from '../assets/oslo-city-bike.png';

interface BikeStations {
  station_id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

interface Availability {
  num_bikes_available: number;
  num_docks_available: number;
  station_id: string;
}

export interface Merged {
  name: string;
  address: string;
  num_bikes_available: number;
  num_docks_available: number;
  lat: number;
  lon: number;
  currentLocationPosition: any;
  station_id?: string;
}

const defaultStations: BikeStations[] = [];
const defaultAvailability: Availability[] = [];
const defaultMergedArray: Merged[] = [];

const StationLocator = () => {
  const [bikeStations, setBikeStations] = useState<BikeStations[]>(defaultStations);
  const [availability, setAvailability] = useState<Availability[]>(defaultAvailability);
  const [mergedArray, setMergedArray] = useState<Merged[]>(defaultMergedArray);
  const [filteredResults, setFilteredResults] = useState<Merged[]>([]);
  const [nearestStation, setNearestStation] = useState<Merged[]>([]);
  const [currentLocationPosition, setCurrentLocationPosition] = useState({
    currentLatitude: 0,
    currentLongitude: 0
  });
  const [stationLatLon, setStationLatLon] = useState([{
    latitude: 0,
    longitude: 0
  }]);
  const [searchInput, setSearchInput] = useState("");
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState("");

  const showAllStations = () => {
    setNearestStation([]);
    setSearchInput("");
  }

  const findNearestStation = () => {
    const nearestLatLon = findNearest({ latitude: currentLocationPosition.currentLatitude,
      longitude: currentLocationPosition.currentLongitude }, stationLatLon);

    setNearestStation(mergedArray.filter(station => station.lat === (nearestLatLon as any).latitude &&
      station.lon === (nearestLatLon as any).longitude));

    console.log(nearestLatLon)

    setSearchInput("");
  }

  const mergeArrays = useCallback(
    () => {
      setMergedArray((bikeStations as Merged[])
        .map(station => (
          { ...station, ...availability.find(element => element.station_id === station.station_id) }
        ))
      );
      return mergeArrays;
    }, [availability, bikeStations]
  )

  const fetchData = useCallback(
    async () => {
      const headers = {
        "Client-Identifier": "mass-codingAssignment"
      }

      try {
        const bikeStationResult = await axios
          .get<any>("https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json",
            { headers: headers });
        const availabilityResult = await axios
          .get<any>("https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json",
            { headers: headers });
        setBikeStations(bikeStationResult.data.data.stations);
        setAvailability(availabilityResult.data.data.stations);
        setStationLatLon(bikeStationResult.data.data.stations.map((station: any) => (
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
    setSearchInput(event.target.value.toLowerCase());
    const filteredArray = mergedArray.filter(element => {
      return Object.values(element).join(' ').toLowerCase().includes(searchInput.toLowerCase());
    });
    setFilteredResults(filteredArray);
  }

  useEffect(() => {
    fetchData()
      .catch(console.error)
  }, [fetchData]);

  useEffect(() => {
    mergeArrays();
  }, [mergeArrays]);

  return (
    <>
      <div className='flex flex-col items-center text-3xl font-bold py-12 px-4 text-cityBike'>
        <span className='block'>Welcome to</span>

        <img className='rounded-md py-4 w-64 sm:w-96' src={cityBikeLogo} alt={"Oslo city bike"} />

        <span className='block'>station finder</span>
      </div>

      {fetching ?
        <div className="flex justify-center pt-20">
          <LoadingIndicator />
        </div>
        :
        <>
          <div className='px-4 flex flex-col justify-center sm:flex-row mb-4'>
            <div className='relative'>
              <div className="search-icon">
                <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>

              <input type="text" placeholder='Search' className="input" value={searchInput}
                     onChange={handleSearch}
              />
            </div>

            {nearestStation.length ?
              <button className='button' onClick={showAllStations}>
                Show me all stations
              </button> :
              <button className='button disabled:disabled-style' onClick={findNearestStation}
                      disabled={currentLocationPosition.currentLatitude === 0}>
                Show me the nearest station
              </button>}
          </div>

          <div className='wrapper'>
            {nearestStation.length ? nearestStation.map((station, index) => {
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
              )
            }) :
              <>
                {searchInput.length ?
                  filteredResults.map((station, index) => {
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
                    )
                  }) : mergedArray.map((station, index) => {
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
                    )
                  })}
              </>
            }
          </div>
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