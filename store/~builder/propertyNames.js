
exports.getPropertyName = (information, args) => {
	
	let function_name = "info";

	let propertyNames = Object.keys(information).filter(function (propertyName) {
		return propertyName.indexOf(args[0]) === 0;
	});

	if (propertyNames.length !== 0) {
		function_name = propertyNames[0];
		args.shift()
	}
	
	return { args, function_name }
}