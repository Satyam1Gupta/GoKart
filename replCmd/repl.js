import readline from 'readline'


import { Product, Warehouse,Order } from'../model/gokart.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

 function addProduct(input) {
  const [name, sku, category, subCategory, imageLink] = input.split(',');
  const product = new Product({
    name: name.trim(),
    sku: parseInt(sku),
    category: category.trim(),
    subCategory: subCategory.trim(),
    imageLink: imageLink ? imageLink.trim() : undefined,
  });

  product.save((err) => {
        if (err) {
            console.error('Error adding product:', err.message);
        } else {
            console.log('Product added successfully');
        }
        rl.prompt();//for user input by cmd line
    });
}

function addWarehouse(input) {
  const [warehouseNumber, name, state, location, stockLimit] = input.split(',');
  const [lat, long] = location.replace(/[\(\)]/g, '').split(' ');
 console.log(long)
  const warehouse = new Warehouse({
    warehouseNumber: warehouseNumber.trim(),
    name: name.trim(),
    state: state.trim(),
    location: [parseInt(lat), parseInt(long)],
    stockLimit: stockLimit ? parseInt(stockLimit) : undefined,
  });

  warehouse.save((err) => {
    if (err) {
      console.error('Error adding warehouse:', err.message);
    } else {
      console.log('Warehouse added successfully');
    }
    rl.prompt();
  });
}

function addStock(input) {
    const [sku, warehouseNumber, qty] = input.split(',');
  
    Product.findOne({ sku: parseInt(sku) }, (err, product) => {
      if (err || !product) {
        console.error('Invalid SKU');
        rl.prompt();
        return;
      }
  
      Warehouse.findOne({ warehouseNumber: warehouseNumber.trim() }, (err, warehouse) => {
        if (err || !warehouse) {
          console.error('Invalid warehouse number');
          rl.prompt();
          return;
        }
  
        const stockLimit = warehouse.stockLimit;
        if (stockLimit !== Infinity && qty > stockLimit) {
            console.warn('Warning: Stock limit will be exceeded. Adjusting quantity.');
            product.stock += stockLimit;
          } else {
            product.stock += parseInt(qty);
          }
    
          product.save((err) => {
            if (err) {
              console.error('Error adding stock:', err.message);
            } else {
              console.log('Stock added successfully');
            }
            rl.prompt();
          });
        });
      });}

    function addState(input) {
        const state = input.replace(/\"/g, '').trim();
      
        Warehouse.find({ state }, (err, warehouses) => {
          if (err) {
            console.error('Error finding warehouses:', err.message);
            rl.prompt();
            return;
          }
      
          if (warehouses.length > 0) {
            console.error(`There are already warehouses in the state ${state}`);
            rl.prompt();
            return;
          }
      
          const warehouse = new Warehouse({
            warehouseNumber: generateWarehouseNumber(state),
            name: `Warehouse in ${state}`,
      state,
      location: [0, 0], // Set default location or update with actual coordinates
    });

    warehouse.save((err) => {
      if (err) {
        console.error('Error adding warehouse:', err.message);
      } else {
        console.log(`Warehouse added successfully in ${state}`);
      }
      rl.prompt();
    });
  });
}

function viewStates() {
    Warehouse.aggregate(
      [
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
            totalStockCapacity: { $sum: '$stockLimit' },
          },
        },
      ],
      (err, result) => {
        if (err) {
          console.error('Error retrieving state information:', err.message);
        } else {
          console.log('State\t\tState Code\tWarehouses\tTotal Stock Capacity');
          result.forEach((stateInfo) => {
            console.log(
              `${stateInfo._id}\t\t${stateInfo._id.substring(0, 2)}\t\t${stateInfo.count}\t\t${stateInfo.totalStockCapacity}`
            );
          });
        }
        rl.prompt();
      }
    );
  }

  function processOrder(input) {
    const [customerId, sku, orderQty, customerLoc] = input.split(',');
  
    Product.findOne({ sku: parseInt(sku) }, (err, product) => {
      if (err || !product) {
        console.error('Invalid SKU');
        rl.prompt();
        return;
      }
  
      Warehouse.find({}, (err, warehouses) => {
        if (err) {
          console.error('Error retrieving warehouses:', err.message);
          rl.prompt();
          return;
        }
  
        const sortedWarehouses = sortWarehousesByDistance(warehouses, customerLoc);
        let remainingQty = parseInt(orderQty);
  
        for (const warehouse of sortedWarehouses) {
          if (remainingQty === 0) {
            break;
          }
  
          if (warehouse.stock >= remainingQty) {
            warehouse.stock -= remainingQty;
            remainingQty = 0;
          } else {
            remainingQty -= warehouse.stock;
            warehouse.stock = 0;
          }
        }
  
        if (remainingQty === 0) {
          console.log('Order processed successfully');
        } else {
          console.error('Out of stock. Unable to fulfill the order');
        }
  
        rl.prompt();
      });
    });
  }
  
  function sortWarehousesByDistance(warehouses, customerLoc) {
    const customerLocation = parseLocation(customerLoc);
  
    return warehouses.sort((a, b) => {
      const aDistance = calculateDistance(customerLocation, a.location);
      const bDistance = calculateDistance(customerLocation, b.location);
  
      return aDistance - bDistance;
    });
  }
  
  function parseLocation(location) {
    const [lat, long] = location.trim().replace(/[\(\)]/g, '').split(' ');
    return [parseFloat(lat), parseFloat(long)];
  }
  
  function calculateDistance(loc1, loc2) {
    // Calculate the distance between two locations
   
    return Math.abs(loc1[0] - loc2[0]) + Math.abs(loc1[1] - loc2[1]);
  }
  
  function viewOrders() {
    Order.find({})
      .populate('warehouse')
      .exec((err, orders) => {
        if (err) {
          console.error('Error retrieving orders:', err.message);
        } else {
          console.log('Customer ID\tOrder Date\t\tFulfillment Status\tWarehouse');
  
          orders.forEach((order) => {
            const fulfillmentStatus = order.fulfilled ? 'Fulfilled' : 'Pending';
            const warehouseName = order.warehouse ? order.warehouse.name : 'N/A';
  
            console.log(
              `${order.customerId}\t\t${order.orderDate}\t${fulfillmentStatus}\t\t${warehouseName}`
            );
          });
        }
        rl.prompt();
      });
  }

  function listProducts() {
    Product.find({}, (err, products) => {
      if (err) {
        console.error('Error retrieving products:', err.message);
      } else {
        console.log('Product\t\tStock Quantity\tIn Stock Warehouses');
  
        products.forEach((product) => {
          const warehouses = product.stock > 0 ? 'Yes' : 'No';
          console.log(`${product.name}\t\t${product.stock}\t\t${warehouses}`);
        });
      }
      rl.prompt();
    });
  }

  function listWarehouses() {
    Warehouse.find({}, (err, warehouses) => {
      if (err) {
        console.error('Error retrieving warehouses:', err.message);
      } else {
        console.log('ID\tState\tLocation (Lat-Long)');
  
        warehouses.forEach((warehouse) => {
          console.log(
            `${warehouse.warehouseNumber}\t${warehouse.state}\t${warehouse.location.join(
              '-'
            )}`
          );
        });
      }
      rl.prompt();
    });
  }

  function warehouseInfo(warehouseNumber) {
  Warehouse.findOne({ warehouseNumber }, (err, warehouse) => {
    if (err || !warehouse) {
      console.error('Invalid warehouse number');
    } else {
      console.log('Warehouse ID:', warehouse._id);
      console.log('Warehouse Number:', warehouse.warehouseNumber);
      console.log('Available SKUs:');

      Product.find({ stock: { $gt: 0 } }, (err, products) => {
        if (err) {
          console.error('Error retrieving products:', err.message);
        } else {
          const availableSKUs = products.filter((product) =>
            warehouse.products.includes(product._id)
          );

          availableSKUs.forEach((product) => {
            console.log(`${product.sku} - ${product.name}`);
          });
        }
        console.log('Available Storage:', warehouse.stockLimit === -1 ? 'Unlimited' : warehouse.stockLimit);
        rl.prompt();
      });
    }
  });
  }

function processCommand(command) {
  const [cmd, ...args] = command.split(' ');

  switch (cmd.toLowerCase()) {
    case 'add':
      if (args[0].toLowerCase() === 'product') {
        addProduct(args.slice(1).join(' '));
      } else if (args[0].toLowerCase() === 'warehouse') {
        addWarehouse(args.slice(1).join(' '));
      }else if(args[0].toLowerCase() === 'stock'){
        addStock(args.slice(1).join(' '));
      
      }else if(args[0].toLowerCase() === 'state'){
        addState(args.slice(1).join(' '));
      }
      else {
        console.error('Invalid command');
        rl.prompt();
      }
      break;

      case 'view':
        if (args[0].toLowerCase() === 'state') {
          viewStates();
        } 
        else if (args[0].toLowerCase() === 'orders') {
            viewOrders();
        }else {
          console.error('Invalid command');
          rl.prompt();
        }
        break;

        case 'process':
      if (args[0].toLowerCase() === 'order') {
        processOrder(args.slice(1).join(' '));
      } else {
        console.error('Invalid command');
        rl.prompt();
      }
      break;

      case 'list':
      if (args[0].toLowerCase() === 'products') {
        listProducts();
      } 
      else if (args[0].toLowerCase() === 'warehouses') {
        listWarehouses();
      } 
      else {
        console.error('Invalid command');
        rl.prompt();
      }
      break;

      case 'warehouse':
      if (args[0].toLowerCase() === 'info') {
        warehouseInfo(args[1]);
      } else {
        console.error('Invalid command');
        rl.prompt();
      }
      break;

    default:
      console.error('Invalid command');
      rl.prompt();
      break;
  }
}

rl.on('line', (input) => {
  processCommand(input);
});

console.log('Welcome to GoKart Inventory Management,Enter the cmd to run');
rl.prompt();
