import {
    BaseService
} from "./base.js";

export class DataService extends BaseService {
    loadData(gameEventId, type, playerId = false, teamId = false) {
        this.app.checkIfLoaded();

        const url = `${this.app.baseURL}/v1/data/stats/games/${gameEventId}/shots`;
        const urlStats = `${this.app.baseURL}/v1/data/stats/games/${gameEventId}/stats`;
        Promise.all([fetch(url), fetch(urlStats)])
            .then(([response1, response2]) => Promise.all([response1.json(), response2.json()]))
            .then(([responseData, statsResponseData]) => {
                if(responseData.shots && statsResponseData.stats){
                    let filtredShots;
                    let filtredStats;

                    if (playerId) {
                        filtredShots = responseData.shots.filter(obj => obj.pid === String(playerId));
                        filtredStats = statsResponseData.stats.filter(obj => obj.pid === String(playerId));
                    } else if (teamId) {
                        filtredShots = responseData.shots.filter(obj => obj.tid === String(teamId));
                        filtredStats = statsResponseData.stats.filter(obj => obj.tid === String(teamId));
                    } else {
                        filtredShots = responseData.shots;
                        filtredStats = statsResponseData.stats;
                    }             

                    filtredShots.sort((a, b) => (a.st === "MAKE" ? 1 : -1));

                    /*
                    let numberOfShots = filtredShots.length;
                    let numberOf3s = 0;
                    let points = 0;
                    let makes = 0;
                    filtredShots.every((shot) => {
                        if (shot.st == "MAKE") {
                            if (shot.is3) {
                                numberOf3s++;
                                points = points + 3;
                            }
                            else{
                                points = points + 2;
                            }
                            makes++;
                        }					
                        return true;
                    });
                    let makesRate = 0;
                    let tripleRate = 0;
                    if(numberOfShots){
                        makesRate = Math.round(makes / numberOfShots * 100);
                        tripleRate = Math.round(numberOf3s / numberOfShots * 100);
                    }
                    this.app.stat1 = points.toString();
                    this.app.stat2 = makesRate + "%";
                    this.app.stat3 = tripleRate + "%";
                    */
                    this.app.stat1 = "0";
                    this.app.stat2 = "0%";
                    this.app.stat3 = "0%";

                    if (filtredStats.length > 0) {
                        if (playerId) {
                            let stats = filtredStats[0].totalStats;
                            if(stats.PTS) this.app.stat1 = stats.PTS.toString();
                            if(stats.FG && stats.FGA) this.app.stat2 = ((stats.FG / stats.FGA) * 100).toFixed(1) + "%";
                            if(stats.FG3 && stats.FGA3) this.app.stat3 = ((stats.FG3 / stats.FGA3) * 100).toFixed(1) + "%";
                        }
                        else {
                            let pts = 0;
                            let fg = 0;
                            let fga = 0;
                            let fg3 = 0;
                            let fga3 = 0;

                            filtredStats.every((stat) => {
                                if (stat.totalStats) {
                                    if (stat.totalStats.PTS){
                                        pts += stat.totalStats.PTS;
                                    }
                                    if (stat.totalStats.FG){
                                        fg += stat.totalStats.FG;
                                    }
                                    if (stat.totalStats.FGA){
                                        fga += stat.totalStats.FGA;
                                    }
                                    if (stat.totalStats.FG3){
                                        fg3 += stat.totalStats.FG3;
                                    }
                                    if (stat.totalStats.FGA3){
                                        fga3 += stat.totalStats.FGA3;
                                    }
                                }
                                return true;
                            });

                            this.app.stat1 = pts.toString();
                            if(fga) this.app.stat2 = ((fg / fga) * 100).toFixed(1) + "%";
                            if(fga3) this.app.stat3 = ((fg3 / fga3) * 100).toFixed(1) + "%";
                        }
                    }
                    
                    
                    this.app.screenService.setUpMainScreen({
                        firstName: "Text1",
                        lastName: "Text2",
                        number: "Text3",
                        stat1: this.app.stat1,
                        stat2: this.app.stat2,
                        stat3: this.app.stat3,
                        backgroundImgUrl: this.app.extractedData.screensCenter,
                        teamLogoBackgroundImgUrl: this.app.extractedData.logoScreen,
                        playerImgUrl: null,
                        color: null,
                        noImage: this.app.extractedData.screensCenter ? false : true
                    })

                    if (type == 'shots') {
                        this.app.segmentService.setUpSegments();
                        this.app.shotService.clearShots();
                        this.app.runtime.shots = filtredShots.map((shot) => this.app.shotService.prepareShot(shot));
                    } else if (type == 'zones') {
                        let data = {};

                        filtredShots.every((shot) => {
                            if (!("segment_" + shot.z in data)) {
                                data["segment_" + shot.z] = {
                                    missed: 0,
                                    made: 0
                                };
                            }
                            if (shot.st == "MISS") {
                                data["segment_" + shot.z].missed++;
                            }
                            data["segment_" + shot.z].made++;
                            return true;
                        });

                        this.app.segmentService.setUpSegments(data);
                    }
                }
                else{
                    console.error("Error: No data");
                    this.app.segmentService.setUpSegments();
                    this.app.shotService.clearShots();
                    this.app.screenService.setUpMainScreen({
                        firstName: "Text1",
                        lastName: "Text2",
                        number: "Text3",
                        stat1: "0",
                        stat2: "0%",
                        stat3: "0%",
                        backgroundImgUrl: this.app.extractedData.screensCenter,
                        teamLogoBackgroundImgUrl: this.app.extractedData.logoScreen,
                        playerImgUrl: null,
                        color: null,
                        noImage: this.app.extractedData.screensCenter ? false : true
                    })
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
    loadStats(){
        if (this.app.extractedData && !this.app.IS_CHROMAKEY) {
            if (this.app.extractedData.type == 'shotMap' && !this.app.extractedData.player) {
                this.loadData(this.app.extractedData.gameId, "shots", false, this.app.extractedData.teamId);
            } else if (this.app.extractedData.type != 'shotMap' && !this.app.extractedData.player) {
                this.loadData(this.app.extractedData.gameId, "zones", false, this.app.extractedData.teamId)
            }
            if (this.app.extractedData.player) {
                let playerId;
                if(typeof this.app.extractedData.player == 'string'){
                    playerId = parseInt(this.app.extractedData.player, 10);
                }
                else{
                    playerId = this.app.extractedData.player.id;
                }
                if (this.app.extractedData.type == 'shotMap') {
                    this.loadData(this.app.extractedData.gameId, "shots", playerId);
                } else {
                    this.loadData(this.app.extractedData.gameId, "zones", playerId)
                }
            }
        }
    }

}