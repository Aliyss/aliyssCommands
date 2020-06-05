const {CanvasRenderService} = require('chartjs-node-canvas');

const width = 400;
const height = 400;
const chartCallback = (ChartJS) => {

	// Global config example: https://www.chartjs.org/docs/latest/configuration/
	ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
	// Global plugin example: https://www.chartjs.org/docs/latest/developers/plugins.html
	ChartJS.plugins.register({
		// plugin implementation
	});
	// New chart type example: https://www.chartjs.org/docs/latest/developers/charts.html
	ChartJS.controllers.MyType = ChartJS.DatasetController.extend({
		// chart implementation
	});
};

const canvasRenderService = new CanvasRenderService(width, height, chartCallback);

exports.getChart = (lineData, linelabels, name) => {
	const configuration = {
		type: 'line',
		data: {
			labels: linelabels,
			datasets: [
				{
					label: name,
					pointBackgroundColor: "white",
					borderColor: "red",
					data: lineData
				}
			]
		},
		options: {

		}
	};
	
	/*	const image = await canvasRenderService.renderToBuffer(configuration);
		console.log(image)
		const dataUrl = await canvasRenderService.renderToDataURL(configuration);
		console.log(dataUrl)*/
	const stream = canvasRenderService.renderToStream(configuration);
	return stream
}