const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

// /api/menus/:menuId/menu-items
// TODO setup common validations

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

/* TODO GET
Returns a 200 response containing all saved menu items related to the menu with
the supplied menu ID on the menuItems property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response
*/

menuItemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menuItem.menu_id = $menuId';
  const values = {$menuId: req.params.menuId};
  db.all(sql, values, (error, menuItems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  });
});

/* TODO POST
Creates a new menu item, related to the menu with the supplied menu ID, with the
information from the menuItem property of the request body and saves it to the database.
 Returns a 201 response with the newly-created menu item on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response

Table structure: MenuItem
id - Integer, primary key, required
name - Text, required
description - Text, optional
inventory - Integer, required
price - Integer, required
menu_id - Integer, foreign key, required
*/

menuItemsRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description;
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;
  const menuId = req.params.menuId;
  const menuItemSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuItemValues = {$menuId: menuId};
  db.get(menuItemSql, menuItemValues, (error, menu) => {
    if (error) {
      next(error);
    } else if (menuId) {
      if (!name || !inventory || !price || !menu) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
          'VALUES ($name, $description, $inventory, $price, $menuId)';
      const values = {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: req.params.menuId
      };

      db.run(sql, values, function (error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
            (error, menuItem) => {
              res.status(201).json({menuItem: menuItem});
            });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// /api/menus/:menuId/menu-items/:menuItemId

/* TODO PUT
Updates the menu item with the specified menu item ID using the information from the
 menuItem property of the request body and saves it to the database. Returns a 200
 response with the updated menu item on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
*/

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description === null ? '' : req.body.menuItem.description;
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;
  // const menuId = req.body.menuItem.menu_id;
  const menuId = req.params.menuId;
  const menuItemSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuItemValues = {$menuId: menuId};

  db.get(menuItemSql, menuItemValues, (error, menu) => {
    if (error) {
      next(error);
    } else if (menuId) {
      if (!name || !inventory || !price || !menu) {
        return res.sendStatus(400);
      }

      const sql = 'UPDATE MenuItem SET name = $name, description = $description, ' +
          'inventory = $inventory, price = $price, menu_id = $menuId ' +
          'WHERE MenuItem.id = $menuItemId';
      const values = {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: menuId,
        $menuItemId: req.params.menuItemId
      };
      db.run(sql, values, function (error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
            function (error, menuItem) {
              res.status(200).json({menuItem: menuItem});
            });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

/* TODO DELETE
Deletes the menu item with the supplied menu item ID from the database. Returns a 204 response.
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
*/

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemsRouter;
