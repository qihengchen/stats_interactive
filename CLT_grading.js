const fs = require('fs');
const csv = require('csvtojson');
const jStat = require('jStat').jStat;
const seedrandom = require('seedrandom');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputfile = './file.csv';
const outputfile = './scores.csv';
const scores = new Array();
const questionIDs = ['219354', '219355', '219356', '219357', '219358', '219359', '219360',
						'219363', '219364', '219365', '219366', '219367',
						'219370', '219371',
						'219374', '219375'];

csv()
.fromFile(inputfile)
.then((jsonObj)=>{ // jsonObj: an array of maps
	Object.values(jsonObj).forEach(student => {
		let seed = student.sis_id; //UNI id
		let correct = 0;

		// question set: constructor(seed, distType, mean, stdDev, populationSize, sampleSize, nSamples)
		let qs1 = new Sample(seed, 'normal', 0, 4, 10000, 25, 100);
		// q1: what is the value of the first observation drawn in the first sample?
		let q1 = qs1.getSampleValue(0, 0);
		let q2 = qs1.getSampleValue(24, 0);
		let q3 = qs1.getNumbersGreaterThan(8, 1);
		let q4 = qs1.getSample(2).indexOf(Math.max(...qs1.getSample(2))) + 1;
		let q5 = qs1.getSampleMean(4);
		let q6 = qs1.getNumbersLessThan(-3);
		let q7 = qs1.getNumbersLessThan(-3, qs1.nSamples-1);
		console.log(seed);
		console.log(q1);
		console.log(q2);
		console.log(q3);
		console.log(q4);
		console.log(q5);
		console.log(q6);
		console.log(q7);
		console.log('\n');

		let qs2 = new Sample(seed, 'skew_right', 0, 4, 10000, 100, 500);
		let q9 = qs2.getSampleValue(0, 0);
		let q10 = qs2.getSampleMean(0);
		let q11 = qs2.getSampleValue(qs2.sampleSize-1, 1);
		let q12 = qs2.getNumbersGreaterThan(4, 1);
		let q13 = qs2.getNumbersGreaterThan(4);
		console.log(q9);
		console.log(q10);
		console.log(q11);
		console.log(q12);
		console.log(q13);
		console.log('\n');

		let qs3 = new Sample(seed, 'skew_right', 0, 4, 10000, 5, 500);
		let q15 = qs3.getSampleValue(0, 0);
		let q16 = qs3.getSampleMean(4);
		console.log(q15);
		console.log(q16);
		console.log('\n');

		let qs4 = new Sample(seed, 'normal', 0, 4, 10000, 5, 1000);
		let q18 = qs4.getSampleValue(0, 0);
		let q19 = qs4.getSampleMean(4);
		console.log(q18);
		console.log(q19);		
		console.log('\n');

		let correctAnswers = [q1, q2, q3, q4, q5, q6, q7,
							q9, q10, q11, q12, q13,
							q15, q16,
							q18, q19];

		questionIDs.forEach((questionID, index) => {
			Object.entries(student).forEach((entry) => {
				if (entry[0].toString().startsWith(questionID)) {
					if (entry[1].toString() == correctAnswers[index]) {
						console.log(questionID + '  ' + entry[1]);
						correct += 1;
					}
				}
			});
		});
		
		console.log('Score is: ' + correct + '\n\n'); 

		scores.push({uni: seed, score: correct});
	});


	const csvWriter = createCsvWriter({  
	  	path: outputfile,
	  	header: [
		    {id: 'uni', title: 'UNI'},
		    {id: 'score', title: 'Score'}
	  	]
	});

	csvWriter  
  	.writeRecords(scores)
  	.then(()=> console.log('The CSV file was written successfully'));

});


class Sample {
	constructor(seed, distType, mean, stdDev, populationSize, sampleSize, nSamples) {
		this.seed = seed;
		this.distType = distType;
		this.mean = mean;
		this.stdDev = stdDev;
		this.populationSize = populationSize;
		this.sampleSize = sampleSize;
		this.nSamples = nSamples;

		this.population = new Array();
		this.samples = new Array();
		this.sampleMeans = new Array();

		this.generatePopulation();
		this.runSample();
	}

	generatePopulation() {
	    let rate = 1 / this.stdDev;
	    let saltedSeed = this.seed + this.populationSize + this.mean + this.stdDev + this.distType;

	    // Reset the global Math.random everytime this is called
	    seedrandom(saltedSeed, {global: true});

	    switch (this.distType) {
	    case 'normal':
	        this.population = [...Array(this.populationSize)].map((e) => {
	            return +jStat.normal.sample(this.mean, this.stdDev).toFixed(3);
	        });
	        return this.population;

	    case 'skew_right':
	        this.population = [...Array(this.populationSize)].map((e) => {
	            return +(jStat.exponential.sample(rate) - this.stdDev + this.mean).toFixed(3);
	        });
	        return this.population;

	    default:
	        // return a normal distribution
	        this.population = [...Array(this.populationSize)].map((e) => {
	            return +jStat.normal.sample(this.mean, this.stdDev).toFixed(3);
	        });
	        return this.population;
	    }
	}


	runSample() {
	    // Use the base64 encoding of the seed as a simple hash
	    let saltedSeed = this.seed + this.populationSize + this.mean + this.stdDev + this.distType;
	    let samplingSeed = Buffer.from(saltedSeed).toString('base64');
	    let ng = seedrandom(samplingSeed);

	    // samples = array[nSamples][sampleSize]
	    this.samples = [...Array(this.nSamples)].map((e) => {
	        return [...Array(this.sampleSize)].map((e) => {
	            let idx = Math.floor(ng() * this.population.length);
	            return this.population[idx];
	    	});
	    });

	    this.sampleMeans = this.samples.reduce((acc, e) => {
            acc.push(
                +jStat.mean(e).toFixed(3)
            );
            return acc;
        }, []);

	    return this.samples;
	}

	getSample(sampleIndex) {
		return this.samples[sampleIndex];
	}

	getSampleValue(valueIndex, sampleIndex) {
		return this.samples[sampleIndex][valueIndex];
	}

	getSampleMean(sampleIndex) {
		return this.sampleMeans[sampleIndex];
	}

	getNumbersGreaterThan(value, sampleIndex=-1) {
		if (sampleIndex < 0) {
			return this.sampleMeans.filter(mean => mean > value).length;
		}
		return this.samples[sampleIndex].filter(mean => mean > value).length;
	}

	getNumbersLessThan(value, sampleIndex=-1) {
		if (sampleIndex < 0) {
			return this.sampleMeans.filter(mean => mean < value).length;
		}
		return this.samples[sampleIndex].filter(mean => mean < value).length;
	}

}













