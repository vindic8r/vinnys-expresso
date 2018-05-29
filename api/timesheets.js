const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

// /api/employees/:employeeId/timesheets
// TODO setup common validations

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

/* TODO GET
Returns a 200 response containing all saved timesheets related to the employee
with the supplied employee ID on the timesheets property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/

timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {$employeeId: req.params.employeeId};
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

/* TODO POST
Creates a new timesheet, related to the employee with the supplied employee ID,
with the information from the timesheet property of the request body and saves it to the database.
Returns a 201 response with the newly-created timesheet on the timesheet property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
*/

timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  // const employeeId = req.body.timesheet.employee_id;
  const employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employee_id';
  const employeeValues = {$employee_id: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else if (employeeId) {
      if (!hours || !rate || !date || !employee) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
          'VALUES ($hours, $rate, $date, $employeeId)';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: req.params.employeeId
      };

      db.run(sql, values, function (error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              res.status(201).json({timesheet: timesheet});
            });
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// /api/employees/:employeeId/timesheets/:timesheetId

/* TODO PUT
Updates the timesheet with the specified timesheet ID using the information
from the timesheet property of the request body and saves it to the database.
Returns a 200 response with the updated timesheet on the timesheet property of the response body
If any required fields are missing, returns a 400 response
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
*/

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employee_id';
  const employeeValues = {$employee_id: employeeId};

  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else if (employeeId) {
      if (!hours || !rate || !date || !employee) {
        return res.sendStatus(400);
      }

      const sql = 'UPDATE Timesheet SET hours = $hours, ' +
          'rate = $rate, date = $date, employee_id = $employee_id ' +
          'WHERE Timesheet.id = $timesheetId';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employee_id: req.params.employeeId,
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, values, function (error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
            function (error, timesheet) {
              res.status(200).json({timesheet: timesheet});
            }
          );
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

/* TODO DELETE
Deletes the timesheet with the supplied timesheet ID from the database. Returns a 204 response.
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
*/

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};
  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;