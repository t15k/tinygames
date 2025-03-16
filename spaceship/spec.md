# Spaceship specification

The player controls a spaceship and avoid or shoot
incoming enemy spaceship.

## Layout
 The players spaceship is located on the left side
 of the screen.

Incoming enemies enters from the right.

Player score is at the top left.

Level is displayed at the top right.

All image files can be found in the folder `images`.

## Highscore list

When the game is not playing, show a highscore list on top
of the spaceship area.
The highscore list have a max of 10 entries, going highest to lowest (top down).
When a player is game the must be asked for the initials (max three charaters) if
the qualify for the list.

The list must be persisted between browser reloads. Also we should reset the list
if there is a major version update to the game.

The current version is 1.

## Movement

The player spacehip can only move up and down. The player uses arrow up and down to
control the direction.

Enimies enter from the right and move in a straight line towards the side of the screen.

## Enemies

There three kinds of enemy spaceships.

- Frigates, have one hitpoint. Use the image `Frigate.png` for graphics.
- Destroyers. Have two hitpoints.
  Use the image `Destroyer.png` for graphics.
- Corvette. Have one hit point. Corvettes can fire back
  et the player. Can only have one short active at any given time. If the
  player is hit, the player loose one life.
  Initially on one covertte on screen is allowed. For every five levels
  one extra corvette is allowed on screen.
  Corvettes are draw as triangles with the point pointed at the players
  side. Short are fired from the point.
  Use the image `Corvette.png` for graphics.

## The player

The players spaceship can shoot. If an enemy spaceship is hit by a shot,
it looses one hitpoint. If a ship has zero hitpoints, it is removed
from the screen. The player can only have on shot active
at any point in time.

For the player graphics use the image `Player_Spaceship.png`.

## Scoring

The player accumaltes points by hitting enemy spaceships.

- Frigates: 1 point
- Destroyer: 2 points
- Corvette: 1 point

## Visuals

The players spaceship is to be drawn as a blue triange, with
the a point poinint at the enemry. Shot are fired from the tip of 
the point . Make the trianlge edge size 20 pct of the screen height.

The enemy spaceships are red rectangles where their length 10 pct of
the screen height.

## Difficulty and levels

The player start at level one. The number of enemy spaceships allowed on
the screen is level plus two. The game should strive to having a minmum of
the same number of enemy ships on screen as the the current leve. Launching
enemy ships in parrallel if needed, to reach that number.

As time passes the level goes up. The level is incremented by one
every 30 seconds.

## End of game

If the player is hit three by enemy spaceship, the looser and
the game is over.


## AI section

Notes and feedback from the AI implementing the game

- A basic game loop using requestAnimationFrame
- Collision detection
- Lives counter
- Game over state with a restart button
- Randomly positioned enemy spawns
- Clear visual distinction between player, enemies, and shots
