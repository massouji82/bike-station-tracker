import { Merged } from "./StationLocator";
import './StationCard.css';
import { ReactComponent as LinkIcon } from '../assets/external-link.svg';

const StationCard = ({
                       name,
                       address,
                       num_bikes_available,
                       num_docks_available,
                       lat,
                       lon,
                       currentLocationPosition
                      }: Merged) => {
  return (
    <div className="card">
      <div className='font-medium'>Station name:</div>

      <div className='font-bold text-cityBike'>
        {name}
      </div>

      <div className='font-medium'>Address:</div>

      <div className='font-bold text-cityBike'>
        {address}
      </div>

      <div className='font-medium'>Available bikes:</div>

      <div className='font-bold text-cityBike'>
        {num_bikes_available}
      </div>

      <div className='font-medium'>Available docks:</div>

      <div className='font-bold text-cityBike'>
        {num_docks_available}
      </div>

      <a className="link" target="_blank" rel="noopener noreferrer"
         href={`https://www.google.com/maps/dir/${currentLocationPosition.currentLatitude},
         ${currentLocationPosition.currentLongitude}/${lat},${lon}/@59.9,10.6965678,12z/data=!4m2!4m1!3e2`}
      >
        Show route to station
        <LinkIcon className="fill-blue-900 ml-2" />
      </a>
    </div >
  )
}

export default StationCard;