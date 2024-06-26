import express from 'express';
import { promisify } from 'util';
import { createClient } from 'redis';

const listProducts = [
  {
    itemId: 1,
    itemName: 'Suitcase 250',
    price: 50,
    initialAvailableQuantity: 4,
  },
  {
    itemId: 2,
    itemName: 'Suitcase 450',
    price: 100,
    initialAvailableQuantity: 10,
  },
  {
    itemId: 3,
    itemName: 'Suitcase 650',
    price: 350,
    initialAvailableQuantity: 2,
  },
  {
    itemId: 4,
    itemName: 'Suitcase 1050',
    price: 550,
    initialAvailableQuantity: 5,
  },
];

function getItemById(itemID) {
  return listProducts.find((product) => product.itemId === itemID);
}

const app = express();
const client = createClient();
const PORT = 1245;

// Routes
app.get('/list_products', (req, res) => {
  res.json(listProducts);
});

app.get('/list_products/:itemId', async (req, res) => {
  const item = getItemById(parseInt(req.params.itemId, 10));
  if (!item) {
    res.status(404).json({ status: 'Product not found' });
    return;
  }

  try {
    let stock = await getCurrentReservedStockById(req.params.itemId);
    stock = Number.parseInt(stock || 0);
    item.currentQuantity = item.initialAvailableQuantity - stock;
    res.json(item);
  } catch (error) {
    console.error('Error:', err);
    res.status(500).json({ status: 'Internal server error' });
  }
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const item = getItemById(itemId);
  if (!item) {
    res.status(404).json({ status: 'Product not found' });
    return;
  }

  let stock = await getCurrentReservedStockById(itemId);
  stock = Number.parseInt(stock || 0);

  if (stock >= item.initialAvailableQuantity) {
    res.json({ status: 'Not enough stock available', itemId });
    return;
  }
  reserveStockById(itemId, stock + 1);
  res.json({ status: 'Reservation confirmed', itemId });
});

// Redis
function reserveStockById(itemId, stock) {
  client.set(`item.${itemId}`, stock);
}

async function getCurrentReservedStockById(itemId) {
  const getAsync = promisify(client.get).bind(client);
  return getAsync(`item.${itemId}`);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
