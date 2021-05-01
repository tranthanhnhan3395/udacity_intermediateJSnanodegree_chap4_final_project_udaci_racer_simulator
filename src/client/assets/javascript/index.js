// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
  tracks: [],
  racers: [],
};

const updateStore = (store, newState) => {
  store = Object.assign(store, newState);
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt('#tracks', html);
      updateStore(store, { tracks });
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt('#racers', html);
      updateStore(store, { racers });
    });
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches('.card.track')) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches('.card.podracer')) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate();
      }
    },
    false,
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  const { tracks, track_id, racers, player_id } = store;

  // render starting UI
  renderAt(
    '#race',
    renderRaceStartView(
      tracks.find((track) => track.id === track_id),
      racers,
    ),
  );

  const race = await createRace(player_id, track_id);
  updateStore(store, { race_id: parseInt(race.ID - 1) });

  // retrieve the race_id just updated from store
  const { race_id } = store;

  // The race has been created, now start the countdown
  await runCountdown();

  // TODO - call the async function startRace
  await startRace(race_id);

  // TODO - call the async function runRace
  await runRace(race_id);
}

function runRace(raceID) {
  try {
    return new Promise((resolve) => {
      const updateLeaderboard = (positions) => {
        renderAt('#leaderBoard', raceProgress(positions));
      };

      const proceedToRaceResult = (positions) => {
        clearInterval(updateRaceInfoInterval);
        renderAt('#race', resultsView(positions));
        resolve();
      };

      const updateRaceInfo = function (raceId) {
        console.log('updating race info');

        getRace(raceID).then((race) => {
          const { status, positions } = race;
          if (status === 'in-progress') {
            updateLeaderboard(positions);
          } else if (status === 'finished') {
            proceedToRaceResult(positions);
          }
        });
      };

      const updateRaceInfoInterval = setInterval(updateRaceInfo, 500, raceID);
    });
  } catch (error) {
    console.log(error);
  }
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const decreaseBigNumbersAndExitWhenDone = () => {
        let bigNumbers = document.getElementById('big-numbers');
        bigNumbers.innerHTML = --timer;

        if (timer === 0) {
          clearInterval(timerDecrementInterval);
          resolve();
        }
      };

      const timerDecrementInterval = setInterval(
        decreaseBigNumbersAndExitWhenDone,
        1000,
      );
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  console.log('selected a pod', target.id);

  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  updateStore(store, { player_id: parseInt(target.id) });
}

function handleSelectTrack(target) {
  console.log('selected a track', target.id);

  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  updateStore(store, { track_id: parseInt(target.id) });
}

function handleAccelerate() {
  console.log('accelerate button clicked');
  accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join('');

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join('');

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  let userPlayer = positions.find((e) => e.id === store.player_id);
  userPlayer.driver_name += ' (you)';

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
  });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER,
    },
  };
}

function getTracks() {
  return fetch(`${SERVER}/api/tracks`)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

function getRacers() {
  return fetch(`${SERVER}/api/cars`)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log('Problem with createRace request::', err));
}

function getRace(id) {
  return fetch(`${SERVER}/api/races/${id}`)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

function startRace(id) {
  return (
    fetch(`${SERVER}/api/races/${id}/start`, {
      method: 'POST',
      ...defaultFetchOpts(),
    })
      // no need to do anything since response is empty
      .then()
      .catch((err) => console.log('Problem with getRace request::', err))
  );
}

function accelerate(id) {
  return (
    fetch(`${SERVER}/api/races/${id}/accelerate`, {
      method: 'POST',
      ...defaultFetchOpts(),
    })
      // no need to do anything since response is empty
      .then()
      .catch((err) => console.log('Problem with accelerate request::', err))
  );
}
