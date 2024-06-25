import { createClient, print } from 'redis';
import { promisify } from 'util';

const client = createClient();

client.on('connect', async () => {
  console.log('Redis client connected to the server');
});

client.on('error', (err) => {
  console.log(`Redis client not connected to the server: ${err.message}`);
});

const getAllAsync = promisify(client.hgetall).bind(client);

function setSchools() {
  const schools = {
    Portland: 50,
    Seattle: 80,
    'New York': 20,
    Bogota: 20,
    Cali: 40,
    Paris: 2,
  };

  for (const [city, value] of Object.entries(schools)) {
    client.hset('HolbertonSchools', city, value, print);
  }
}

async function displayAllSchools() {
  console.log(await getAllAsync('HolbertonSchools'));
}

setSchools();
displayAllSchools();
