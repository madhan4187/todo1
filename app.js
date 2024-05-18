const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

db = null

const initilizeDbAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000/')
  })
}

initilizeDbAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * 
  FROM player_details
  ORDER BY player_id`
  const playerArray = await db.all(getPlayersQuery)
  response.send(
    playerArray.map(eachObj => convertDbObjectToResponseObject(eachObj)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * 
  FROM player_details
  WHERE player_id = ${playerId}`
  const player = await db.get(getPlayerQuery)
  response.send(convertDbObjectToResponseObject(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const updatePlayerQuery = `
  UPDATE player_details
  SET player_name = '${playerName}'
  WHERE player_id = ${playerId}`
  const dbResponse = await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT * 
  FROM match_details
  WHERE match_id = ${matchId}`
  const matchDetail = await db.get(getMatchQuery)
  response.send(convertDbObjectToResponseObject(matchDetail))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `
  SELECT match_details.match_id ,match_details.match,match_details.year
  FROM match_details NATURAL JOIN player_match_score 
  WHERE player_id = ${playerId}`
  const playerMatchDetail = await db.all(getPlayerMatchQuery)
  response.send(
    playerMatchDetail.map(eachObj => convertDbObjectToResponseObject(eachObj)),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerMatcPlayerhQuery = `
  SELECT DISTINCT player_details.player_id, player_details.player_name
  FROM player_details NATURAL JOIN player_match_score 
  WHERE player_match_score.match_id = ${matchId}`
  const matchPlayerDetail = await db.all(getPlayerMatcPlayerhQuery)
  response.send(
    matchPlayerDetail.map(eachObj => convertDbObjectToResponseObject(eachObj)),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getScoreDetailsQuery = `
  SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName, 
    SUM(player_match_score.score) AS totalScore, 
    SUM(player_match_score.fours) AS totalFoures, SUM(player_match_score.sixes) AS totalSixes
  FROM 
    player_match_score NATURAL JOIN player_details ON player_details.player_id = player_match_score.player_id.player_id
  WHERE 
    player_details.player_id = ${playerId}`
  const scoreDetails = await db.get(getScoreDetailsQuery)
  response.send(scoreDetails)
})

module.exports = app
