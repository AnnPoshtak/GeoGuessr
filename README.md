# GeoGuessr

GeoGuessr is a geography game which takes you on a journey around the world and challenges your ability to recognize your surroundings

# Todo

- Make settings persistent
- Increase the size of the mini map
- Possibly migrate to firebase
- Refacactor frontend auth state handling logic
- Migrate backend to FastAPI because of its performance and developer experience
- Rewrite moving to next round logic on frontend, so you can't reload the page and view the next location before others
- Write a better description for the project like the motivation, features, architecture, tech stack, etc.

# Roadmap

I did not really estimate, but I think 2-3 months would be more than enough for this roadmap

## Update 1.0.1

Bare-bone multiplayer. This includes:

- Submitting guesses, moving to next round, ending the game, etc.
- A cooldown which forces another team to submit their guess if other team is ready
- A disconnect cooldown which would record automatical defeat if the whole team has disconnected
- AFK cooldown
- Storing basic data about the game after it has ended

## Update 1.0.2

Improving the multiplayer.

- Ability to surrender
- Adding ranks and improving matchmaking
- Adjusting the locations depending on player's rank
- Ability to view player's profile and report them when right-clicking on them on tab

## Update 1.0.3

Improving performance and scaling the game to handle thousands of concurrent users.

- Move Redis to pub/sub architecture

## Update 1.0.4

Adding expereince improving features

- Ability to set your own google api key
- Ability to cutomize your profile and avatar
- Choosing map types from standard, terrain and satelite
- Add return to original place button
- Edit profile page

## Update 1.0.5

Adjusting the singleplayer

- Ability to select the countries, regions, etc.
- Adding daily challanges

## Update 1.0.6

Adding currency for multiplayer and singleplayer. Both of those currencies allow users to purchase items such as pin skins, ui redesigns, backgrounds, avatars, etc.
