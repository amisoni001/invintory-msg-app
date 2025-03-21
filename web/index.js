import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());   // ✅ Important

const SHOPIFY_STORE_URL = `${process.env.SHOPIFY_SHOP}.myshopify.com`;
const shopifyHeaders = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
};

app.post('/api/save-messages', async (req, res) => {
  const { ukMessage, usMessage, indiaMessage } = req.body;
  if (!ukMessage || !usMessage || !indiaMessage) {
    return res.status(400).json({ error: 'All messages are required' });
  }

  try {
    // Check if a row already exists
    const [rows] = await db.query('SELECT * FROM inventory_shipping_message WHERE id = 1');
    
    if (rows.length > 0) {
      // Update
      await db.query(
        'UPDATE inventory_shipping_message SET uk_message = ?, us_message = ?, india_message = ? WHERE id = 1',
        [ukMessage, usMessage, indiaMessage]
      );
    } else {
      // Insert
      await db.query(
        'INSERT INTO inventory_shipping_message (id, uk_message, us_message, india_message) VALUES (1, ?, ?, ?)',
        [ukMessage, usMessage, indiaMessage]
      );
    }

    res.json({ success: true, message: 'Messages saved successfully' });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Failed to save messages' });
  }
});


// ✅ Fetch All Messages
// ✅ Fetch Messages
app.get('/api/get-messages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory_shipping_message WHERE id = 1');
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'No messages found' });
    }
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


// ✅ Shopify Variant API (You already have it)
app.get('/api/get-variant-detail', async (req, res) => {
  try {
    const productIds = req.query.product_ids;
    if (!productIds) return res.status(400).json({ error: "Missing 'product_ids' query parameter." });

    const productIdArray = productIds.split(',').map(id => id.trim());
    const query = {
      query: `{
        nodes(ids: [${productIdArray.map(id => `"gid://shopify/Product/${id}"`).join(",")}]) {
          ... on Product {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  inventoryPolicy
                  inventoryQuantity
                  inventoryItem {
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          location {
                            name
                          }
                          quantities(names: ["available"]) {
                            name
                            quantity
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`
    };

    const response = await axios.post(
      `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/graphql.json`,
      query,
      { headers: shopifyHeaders }
    );

    const productData = response.data.data.nodes.map(product => ({
      product_id: product.id.replace("gid://shopify/Product/", ""),
      title: product.title,
      variants: product.variants.edges.map(edge => ({
        variant_id: edge.node.id.replace("gid://shopify/ProductVariant/", ""),
        title: edge.node.title,
        sku: edge.node.sku,
        inventory_policy: edge.node.inventoryPolicy,
        available_quantity: edge.node.inventoryQuantity,
        inventoryLocations: edge.node.inventoryItem.inventoryLevels.edges.map(level => ({
          location_name: level.node.location.name,
          available_quantity: level.node.quantities[0]?.quantity || 0
        }))
      }))
    }));

    res.json(productData);

  } catch (error) {
    console.error("❌ API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('🚀 Shopify Inventory API is running!');
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
