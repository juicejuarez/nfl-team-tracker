"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Clock } from "lucide-react"

interface Team {
  id: string
  displayName: string
  abbreviation: string
  location: string
  logos: Array<{
    href: string
  }>
}

interface Game {
  id: string
  date: string
  name: string
  shortName: string
  completed: boolean
  homeTeam: {
    team: {
      displayName: string
      abbreviation: string
      logo: string
    }
    score?: string
  }
  awayTeam: {
    team: {
      displayName: string
      abbreviation: string
      logo: string
    }
    score?: string
  }
}

interface TeamSchedule {
  lastGames: Game[]
  nextGames: Game[]
}

export default function NFLTeamsTable() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamSchedule, setTeamSchedule] = useState<TeamSchedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log("Fetching NFL teams data...")
        const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const teamsData = data.sports[0].leagues[0].teams.map((teamObj: any) => teamObj.team)
        setTeams(teamsData)
      } catch (err) {
        console.error("Error fetching teams:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const fetchTeamSchedule = async (teamId: string) => {
    setScheduleLoading(true)
    setScheduleError(null)

    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const events = data.events || []

      const now = new Date()
      const completedGames: Game[] = []
      const upcomingGames: Game[] = []

      events.forEach((event: any) => {
        const gameDate = new Date(event.date)
        const game: Game = {
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          completed: event.status?.type?.completed || false,
          homeTeam: {
            team: {
              displayName:
                event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "TBD",
              abbreviation:
                event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.abbreviation ||
                "TBD",
              logo: event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.logo || "",
            },
            score: event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "home")?.score,
          },
          awayTeam: {
            team: {
              displayName:
                event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "TBD",
              abbreviation:
                event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.abbreviation ||
                "TBD",
              logo: event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.logo || "",
            },
            score: event.competitions[0]?.competitors?.find((c: any) => c.homeAway === "away")?.score,
          },
        }

        if (game.completed) {
          completedGames.push(game)
        } else if (gameDate > now) {
          upcomingGames.push(game)
        }
      })

      // Sort completed games by date (most recent first) and take last 3
      const lastGames = completedGames
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)

      // Sort upcoming games by date (earliest first) and take next 3
      const nextGames = upcomingGames
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

      setTeamSchedule({ lastGames, nextGames })
    } catch (err) {
      console.error("Error fetching team schedule:", err)
      setScheduleError(err instanceof Error ? err.message : "Failed to load schedule")
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    setTeamSchedule(null)
    fetchTeamSchedule(team.id)
  }

  const closeModal = () => {
    setSelectedTeam(null)
    setTeamSchedule(null)
    setScheduleError(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading NFL Teams...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error Loading Data</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b">
            <h1 className="text-3xl font-bold text-center text-gray-800">NFL Teams</h1>
            <p className="text-center text-gray-600 mt-2">
              Click on a team logo to see recent games and upcoming schedule
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Team Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Abbreviation</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Location</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Logo</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Team ID</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => (
                    <tr key={team.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="border border-gray-300 px-4 py-3 font-medium">{team.displayName}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">{team.abbreviation}</span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">{team.location}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <button
                          onClick={() => handleTeamClick(team)}
                          className="hover:scale-110 transition-transform cursor-pointer p-2 rounded-lg hover:bg-blue-50"
                          title={`Click to see ${team.displayName} schedule`}
                        >
                          <img
                            src={team.logos[0]?.href || "/placeholder.svg"}
                            alt={`${team.displayName} logo`}
                            className="h-12 w-12 object-contain mx-auto"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{team.id}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedTeam.logos[0]?.href || "/placeholder.svg"}
                  alt={`${selectedTeam.displayName} logo`}
                  className="h-12 w-12 object-contain"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.log(`Failed to load logo for ${selectedTeam.displayName}`)
                    e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                  }}
                />
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeam.displayName}</h2>
                  <p className="text-gray-600">{selectedTeam.location}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {scheduleLoading && (
                <div className="text-center py-8">
                  <div className="text-lg">Loading schedule...</div>
                </div>
              )}

              {scheduleError && (
                <div className="text-center py-8 text-red-600">
                  <p className="text-lg font-semibold">Error Loading Schedule</p>
                  <p className="text-sm mt-2">{scheduleError}</p>
                </div>
              )}

              {teamSchedule && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Last 3 Games */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <h3 className="text-xl font-semibold">Recent Games</h3>
                    </div>
                    <div className="space-y-3">
                      {teamSchedule.lastGames.length > 0 ? (
                        teamSchedule.lastGames.map((game) => (
                          <div key={game.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">{formatDate(game.date)}</span>
                              <span className="text-sm font-medium text-green-600">Final</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={game.awayTeam.team.logo || "/placeholder.svg"}
                                  alt={`${game.awayTeam.team.abbreviation} logo`}
                                  className="h-6 w-6 object-contain"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=24&width=24"
                                  }}
                                />
                                <span className="font-medium">{game.awayTeam.team.abbreviation}</span>
                                <span className="text-lg font-bold">{game.awayTeam.score || "0"}</span>
                              </div>
                              <span className="text-gray-500">@</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold">{game.homeTeam.score || "0"}</span>
                                <span className="font-medium">{game.homeTeam.team.abbreviation}</span>
                                <img
                                  src={game.homeTeam.team.logo || "/placeholder.svg"}
                                  alt={`${game.homeTeam.team.abbreviation} logo`}
                                  className="h-6 w-6 object-contain"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=24&width=24"
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent games found</p>
                      )}
                    </div>
                  </div>

                  {/* Next 3 Games */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xl font-semibold">Upcoming Games</h3>
                    </div>
                    <div className="space-y-3">
                      {teamSchedule.nextGames.length > 0 ? (
                        teamSchedule.nextGames.map((game) => (
                          <div key={game.id} className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">{formatDate(game.date)}</span>
                              <span className="text-sm font-medium text-blue-600">Scheduled</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img src={game.awayTeam.team.logo || "/placeholder.svg"} alt="" className="h-6 w-6" />
                                <span className="font-medium">{game.awayTeam.team.abbreviation}</span>
                              </div>
                              <span className="text-gray-500">@</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{game.homeTeam.team.abbreviation}</span>
                                <img src={game.homeTeam.team.logo || "/placeholder.svg"} alt="" className="h-6 w-6" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No upcoming games scheduled</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
