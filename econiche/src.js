const params = new URLSearchParams(location.search)
  const communism = params.get('communism') !== null,
    spacial = params.get('spacial') !== null,
    onlyEatMain = params.get('only-eat-main') !== null ? .5 : false,
    imbalance = params.get('imbalance') !== null

  const rand = max => Math.floor(Math.random() * max)

  const canvas = document.getElementById('main')
  const ctx = canvas.getContext('2d')
  const width = 10,
    height = 10,
    cWidth = 600,
    cHeight = 600,
    initialCount = [ 50, 50 ],
    resUpdate = communism ? [ 10, 10, 10 ] : spacial ? [ .99, .99, .99 ] : [ .8, .8, .8 ],
    maxRes = communism ? [ 10, 10, 10 ] : [ 2, 2, 2 ],
    uses = [ [ 0, 1 ], [ 1, 2 ] ],
    initialE = imbalance ? [ 2, 10 ] : [ 10, 10 ],
    maxE = imbalance ? [ 2, 10 ] : [ 10, 10 ],
    usability = imbalance ? [ 1.03, 1.5 ] : [ 1.1, 1.1 ],
    thresholdE = imbalance ? [ 3, 5 ] : [ 5, 5 ],
    thresholdU = [ 0., 0. ],
    fillStyles = [ 'red', 'blue' ],
    fillResStyles = [ 'rgb(64,255,64)', 'rgb(255,255,64)', 'rgb(64,255,255)' ],
    noneStyle = 'white'

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  let res = Array(width).fill(null).map(() => Array(height).fill(null).map(() => Array(resUpdate.length).fill(0)))
  const refreshRes = () => res = res.map((r, x) => r.map(r1 => r1.map((o, i) => {
    if (spacial) {
      if (x < 4 && i === 0) return o
      if (x === 4 && i === 0) return Math.min(maxRes[i] / 2, o + resUpdate[i] / 2)
      if (x > 6 && i === 2) return o
      if (x === 6 && i === 2) return Math.min(maxRes[i] / 2, o + resUpdate[i] / 2)
      if ((x < 4 || x > 6) && i === 1) return o
    }
    return Math.min(maxRes[i], o + resUpdate[i])
  })))
  refreshRes()

  class Individual {
    constructor (type) {
      this.type = type
      this.pos = [ rand(width), rand(height) ]
      this.energy = initialE[type] + rand(5) - 2
      this._uses = shuffle([...uses[type]])
      this.usability = usability[type]
      this.maxEnergy = maxE[type]
      this.thresholdE = thresholdE[type]
      this.thresholdU = thresholdU[type]
      this.used = Array(resUpdate.length).fill(0)
    }
    get uses () {
      return this._uses.sort((a, b) => this.used[b] - this.used[a])
    }
    get alive () { return this.energy > 0 }
    willContinueEat (usability) {
      if (usability < this.thresholdU) return false
      if (this.energy > this.thresholdE) return false
      return true
    }
  }
  let individuals = initialCount.map((c, i) => Array(c).fill(null).map(() => new Individual(i))).flat()

  let currentTick = 0
  const tick = () => {
    refreshRes()
    shuffle(individuals).forEach(ind => {
      ind.energy--
      if (ind.energy > ind.maxEnergy) return
      const processRes = (resData, usabilityLeft = ind.usability) => {
        let i = 0
        for (let u of onlyEatMain && resData[ind.uses[0]] > onlyEatMain ? [ ind.uses[0] ] : ind.uses) {
          if (resData[u] > 0) {
            let consume = Math.min(resData[u], usabilityLeft)
            if (u !== ind.uses[0]) consume /= 8
            resData[u] -= consume
            ind.energy += consume
            ind.used[u] += consume
            usabilityLeft -= consume
          }
          if (!ind.willContinueEat(usabilityLeft)) break
          i++
        }
        return usabilityLeft
      }
      let usabilityLeft = processRes(res[ind.pos[0]][ind.pos[1]])
      if (ind.willContinueEat(usabilityLeft)) {
        for (d of shuffle([
          [ (res[ind.pos[0] + 1] || [])[ind.pos[1]] , 1, 0 ],
          [ res[ind.pos[0]][ind.pos[1] + 1] , 0, 1 ],
          [ res[ind.pos[0]][ind.pos[1] - 1] , 0, -1 ],
          [ (res[ind.pos[0] - 1] || [])[ind.pos[1]] , -1, 0 ],
        ]).filter(x => !!x[0])) {
          if (individuals.find(ind2 => ind2.pos[0] === ind.pos[0] + d[1] && ind2.pos[1] === ind.pos[1] + d[2] && ind.type === ind2.type)) break
          if (!ind.willContinueEat(usabilityLeft -= processRes(d[0], usabilityLeft))) {
            ind.pos[0] += d[1]
            ind.pos[1] += d[2]
            break
          }
        }
      }
    })
    individuals = individuals.filter(x => x.alive)

    const xMag = cWidth / width / 4, yMag = cHeight / height / 4
    for (let i of Array(width).keys()) {
      for (let j of Array(height).keys()) {
        const xPos = xMag * 4 * i, yPos = yMag * 4 * j
        for (let k of initialCount.keys()) {
          ctx.fillStyle = individuals.find(ind => ind.pos[0] === i && ind.pos[1] === j && ind.type === k) ? fillStyles[k] : noneStyle
          ctx.fillRect(xPos + k * xMag, yPos, yMag, xMag)
          ctx.fillStyle = individuals.filter(ind => ind.pos[0] === i && ind.pos[1] === j && ind.type === k).map(i => fillResStyles[i.uses[0]])[0] || noneStyle
          ctx.fillRect(xPos + k * xMag, yPos, yMag / 2, xMag / 2)
        }
        for (let k of resUpdate.keys()) {
          ctx.fillStyle = noneStyle
          ctx.fillRect(xPos, yPos + ( k + 2 ) * yMag / 2, 2 * xMag, yMag / 2)
          ctx.fillStyle = fillResStyles[k]
          ctx.fillRect(xPos, yPos + ( k + 2 ) * yMag / 2, 2 * xMag * res[i][j][k] / maxRes[k], yMag / 2)
        }
      }
    }
    return currentTick++
  }
  const tickno = document.getElementById('tickno')
  let iid
  const resume = () => iid = setInterval(() => tickno.innerText = tick(), 1)
  const pause = () => clearInterval(iid)
  resume()
