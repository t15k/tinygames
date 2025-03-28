# Stick Fighters specification

Stick Fighters is a game where to teams battle against
each other in a last man (team) standing style of fight.

The game a web game. Use HTML, CSS, and JavaScript to implement.

## Core Game concepts

The game plays a fight between two teams.

A team is made up of one or more combatants.
A human player controls all the combatant on one team
and the computer controls all the combatants on the
opposing team.

### Combatants

A combatant is made up of these stats

- damage, the damage done when attacking.
  Each attack reduces stamina by two
- reaction. Determines the combatants order in the the battle turn.
- stamina. Is required to attack, if to low, an attack
  cannot be made.
- health. If health reaches zero the combatant is out of the battle.

### Winning the game

The game lost by the player, if all combatants on the player team
are defeated. The players wins if all the combatants on the computer
team are defeated.

## Playing the game

The game is played in turns. Each combatant takes on action in a turn,

The order of combatants taking their turn is decided by the combatant rection
attribute. Higher reactions goes before lower reactions.

The following actions are possible.

- Attack, against on opponent.
- Recover, restores four points of stamina.

## Attack
And attack is made against on opponent. 
An attack has 50 percent chance of hitting the selected target.
An attacker causes an amount of damage equal to their damage attribute.

And attack can only be made by a combatant if their stamina is 2 or higher.

# Recover

Restores 4 point of stamina.


## Playing area layouyt

The player team is on the left side of the screen. The computer team is  on the right.
Show all active combatants for a team on the screen in
their respective playing ares.

The menu for actions is displayed at the bottom of the screen. Use arrow keys to navigate
and enter to select an options. When an options is selected perform that action. When the actions is attack, show a popup
where the player can choose oppenent the combatant will attack.


## Playing graphics and style

Images for combatants can be found in the image folder.

The battle field is a dark shade of green. Put some darker areas in
various to represent shrubberies and bushes.

### Effects

- When a combatant is hit, it will flash red for **0.5 seconds**.
- The flash effect should:
  - Temporarily change the combatant's background color to red.
  - Ensure the combatant is visible (e.g., by increasing `z-index`).
  - Reset to the original background color after the flash duration.

## Computer team strategy

When the computer attacks, it picks it's target by random.
There is an equal chance of between each target.


## Battle scenario

Player team:

- Hektor
  - Damage: 2
  - Reaction: 5
  - Stamina: 10
  - Health: 10
  - Image: images/Hektor_Stick.png

- Osvald
  - Damage: 3
  - Reaction: 3
  - Stamina: 10
  - Health: 12
  - Image: images/Osvald_Stick.png

Computer team:

- Angry guy
  - Damage: 4
  - Reaction: 6
  - Stamina: 10
  - Health: 15
  - Image: images/Angry_Stick.png

