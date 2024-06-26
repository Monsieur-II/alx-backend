import { createClient, print } from 'redis';
import { createQueue } from 'kue';
import { promisify } from 'util';
import express from 'express';

const client = createClient();
const app = express();
const PORT = 1245;
const queue = createQueue();
let reservationEnabled = true;

// Redis
function reserveSeat(number) {
  client.set('available_seats', number, print);
}

async function getCurrentAvailableSeats() {
  const availableSeats = await promisify(client.get).bind(client)(
    'available_seats'
  );
  return availableSeats;
}

// Routes
app.get('/available_seats', async (req, res) => {
  const seats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats: seats });
});

app.get('/reserve_seat', async (req, res) => {
  if (!reservationEnabled) {
    res.json({ status: 'Reservation are blocked' });
    return;
  }

  const job = queue.create('reserve_seat');
  job.save((err) => {
    if (err) {
      res.json({ status: 'Reservation failed' });
      return;
    }
    res.json({ status: 'Reservation in process' });
  });

  job
    .on('complete', () => {
      console.log(`Seat reservation job ${job.id} completed`);
    })
    .on('failed', (err) => {
      console.log(`Seat reservation job ${job.id} failed: ${err.message}`);
    });
});

app.get('/process', async (req, res) => {
  res.json({ status: 'Queue processing' });

  queue.process('reserve_seat', async (job, done) => {
    const seats = await getCurrentAvailableSeats();

    reservationEnabled = seats > 1;
    if (seats <= 0) {
      done(new Error('Not enough seats available'));
      return;
    }
    reserveSeat(seats - 1);
    done();
  });
});

// Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
