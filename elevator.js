{
    init: function(elevators, floors) {

        var upFloorQueue = [],
            downFloorQueue = [];

        for (floor of floors) {
            floor.on("up_button_pressed", function() {
                addToFloorQueue(this.floorNum(), "up");
            })
            floor.on("down_button_pressed", function() {
                addToFloorQueue(this.floorNum(), "down");
            })
        }
        for (elevator of elevators) {
            elevator.on("floor_button_pressed", function(floorNum) {
                sortElevatorQueue(this, floorNum);
                whereNext(this, this.currentFloor());
                setIndicator(this, workOutDirection(this));
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                var direction = workOutDirection(this);
                removeFromFloorQueue(floorNum, direction);
                whereNext(this, floorNum);
                setIndicator(this, direction);
            });
            elevator.on("passing_floor", function(floorNum, dir) {
                var direction = workOutDirection(this);
                decideWhetherToStop(elevator, floorNum, direction);
            });
            elevator.on("idle", function() {
                whereNext(this, this.currentFloor());
                setIndicator(this, workOutDirection(this));
            })
        }

        function addToFloorQueue(floorNum, direction) {
            direction === "up" ? upFloorQueue.push(floorNum) : downFloorQueue.push(floorNum);
        }

        function sortElevatorQueue(elevator, currentFloor) {
            var queue = elevator.getPressedFloors().sort();
            var maxVal = Math.max(...queue);
            var minVal = Math.min(...queue);
            var sortFunction;
            if (currentFloor == maxVal) {
                sortFunction = sortDescending;
            } else if (currentFloor == minVal) {
                sortFunction = sortAscending;
            } else {
                sortFunction = sortMixed;
            }

            queue.sort(sortFunction);
            elevator.destinationQueue = queue;
            elevator.checkDestinationQueue();
        }

        function sortAscending() {
            return function(a, b) {
                return b - a
            };
        }

        function sortDescending() {
            return function(a, b) {
                return a - b
            };
        }

        function sortMixed() {
            // sort ascending starting at the current floor +1 then down
            return function(a, b) {
                if (a > currentFloor && b > currentFloor & a > b) {
                    return -1;
                } if (a > currentFloor && b > currentFloor & a < b) {
                    return 0;
                } if (a < currentFloor && a < b) {
                    return 1;
                } if (a < currentFloor && a > b) {
                    return 0;
                }
                return 0;
            }
        }

        function sortFloorQueue(currentFloor) {

        }

        function removeFromFloorQueue(floorNum, direction) {
            if (direction == "up") {
                upFloorQueue = upFloorQueue.filter(function(item) {
                    return item !== floorNum
                });
            } else if (direction == "down") {
                downFloorQueue = downFloorQueue.filter(function(item) {
                    return item !== floorNum
                });
            }
        }

        function setIndicator(elevator, direction) {
            var goingUp = true,
                goingDown = true;

            if (direction == "up") {
                goingDown = false;
            } else if (direction == "down") {;
                goingUp = false;
            }
            // if stopped, illuminate both
            elevator.goingUpIndicator(goingUp);
            elevator.goingDownIndicator(goingDown);
        }

        function workOutDirection(elevator) {
            var direction;
            var currentFloor = elevator.currentFloor();

            if (elevator.destinationDirection() !== "stopped") {
                direction = elevator.destinationDirection();
            } else if (currentFloor == 0 || elevator.destinationQueue[0] > currentFloor) {
                direction = "up";
            } else {
                direction = "down";
            }
            return direction;
        }

        function whereNext(elevator, currentFloor) {
            // an improvement would be to work out which queue to take the next destination from
            if (elevator.destinationQueue.length == 0) {
                if (upFloorQueue.length !== 0) {
                    elevator.destinationQueue.push(upFloorQueue[0]);
                } else if (downFloorQueue.length !== 0) {
                    elevator.destinationQueue.push(downFloorQueue[0]);
                } else {
                    elevator.destinationQueue.push(0);
                }
                elevator.checkDestinationQueue();
            }
        }

        function decideWhetherToStop(elevator, floorNum, direction) {
            if (elevator.loadFactor() < 0.8) {
                if (direction == "up" && upFloorQueue.includes(floorNum)) {
                    elevator.goToFloor(floorNum, true);
                }
                if (direction == "down" && downFloorQueue.includes(floorNum)) {
                    elevator.goToFloor(floorNum, true);
                }
            }
        }
    },

    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}