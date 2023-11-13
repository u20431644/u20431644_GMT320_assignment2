document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch CSV data from a file
    async function fetchCsvData() {
        try {
            const response = await fetch('data/Data_simplified.csv'); // Updated file path
            const csvData = await response.text();
            return csvData;
        } catch (error) {
            console.error('Error fetching CSV data:', error);
        }
    }

    // Function to convert CSV to an array of objects
    function csvToArray(csv) {
        var rows = csv.trim().split('\n');
        var headers = rows[0].split(',');
        var data = [];

        for (var i = 1; i < rows.length; i++) {
            var obj = {};
            var currentRow = rows[i].split(',');

            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentRow[j];
            }

            data.push(obj);
        }

        return data;
    }

    // Function to group data by month and province
    function groupDataByMonthAndProvince(data) {
        var groupedData = {};

        data.forEach(function (row) {
            var date = row.date.split('/')[0] + '/' + row.date.split('/')[1]; // Extract month
            var province = row.iso_3166_2_code;

            var key = date + '-' + province;

            if (!groupedData[key]) {
                groupedData[key] = [];
            }

            groupedData[key].push(row);
        });

        return groupedData;
    }

    // Function to calculate average for a specific column
    function calculateAverage(dataArray, column) {
        var sum = dataArray.reduce(function (acc, row) {
            return acc + parseFloat(row[column]);
        }, 0);

        return sum / dataArray.length;
    }

    // Fetch CSV data and calculate average for workplaces_percent_change_from_baseline in all provinces
    fetchCsvData()
        .then(csvData => {
            // Convert CSV to an array of objects
            var dataArray = csvToArray(csvData);

            // Group data by month and province
            var groupedData = groupDataByMonthAndProvince(dataArray);

            // Calculate average for workplaces_percent_change_from_baseline in all provinces
            var ProvAve = {};
            var ProvAve_grocery = {};
            var ProvAve_retail = {}; // Added for retail_and_recreation_percent_change_from_baseline

            for (var key in groupedData) {
                if (groupedData.hasOwnProperty(key)) {
                    var provinceCode = key.split('-ZA-')[1];

                    if (!ProvAve[provinceCode]) {
                        ProvAve[provinceCode] = {
                            sum: 0,
                            count: 0,
                        };
                    }

                    if (!ProvAve_grocery[provinceCode]) {
                        ProvAve_grocery[provinceCode] = {
                            sum: 0,
                            count: 0,
                        };
                    }

                    if (!ProvAve_retail[provinceCode]) {
                        ProvAve_retail[provinceCode] = {
                            sum: 0,
                            count: 0,
                        };
                    }

                    ProvAve[provinceCode].sum += calculateAverage(groupedData[key], 'workplaces_percent_change_from_baseline'); 
                    //for each province code check the property and then push to the array for each column type
                    ProvAve[provinceCode].count += 1;

                    ProvAve_grocery[provinceCode].sum += calculateAverage(groupedData[key], 'grocery_and_pharmacy_percent_change_from_baseline');
                    ProvAve_grocery[provinceCode].count += 1;

                    ProvAve_retail[provinceCode].sum += calculateAverage(groupedData[key], 'retail_and_recreation_percent_change_from_baseline');
                    ProvAve_retail[provinceCode].count += 1;
                }
            }

            // Calculate final average for each province
            var provinceLabels = [];
            var Prov_average = [];
            var Prov_average_grocery = [];
            var Prov_average_retail = []; // Added for retail_and_recreation_percent_change_from_baseline

            for (var provinceCode in ProvAve) {
                if (ProvAve.hasOwnProperty(provinceCode)) {
                    var ave = ProvAve[provinceCode].sum / ProvAve[provinceCode].count;
                    provinceLabels.push(provinceCode);
                    Prov_average.push(ave);
                }
            }

            for (var provinceCode in ProvAve_grocery) { //for each province code check the property and then
                if (ProvAve_grocery.hasOwnProperty(provinceCode)) {
                    var aveGrocery = ProvAve_grocery[provinceCode].sum / ProvAve_grocery[provinceCode].count;
                    Prov_average_grocery.push(aveGrocery);
                }
            }

            for (var provinceCode in ProvAve_retail) { //for each province code check the property and then push to the array
                if (ProvAve_retail.hasOwnProperty(provinceCode)) {
                    var aveRetail = ProvAve_retail[provinceCode].sum / ProvAve_retail[provinceCode].count;
                    Prov_average_retail.push(aveRetail);
                }
            }

            // Render bar chart
            AveProv_chart('chart1', provinceLabels, Prov_average, 'Workplaces mobility change % over 10 months', 'Average Workplace Mobility Change');
            AveProv_chart_bar('chart2', provinceLabels, Prov_average_grocery, 'Grocery mobility change % over 10 months', 'Average Grocery and Pharmacy Mobility Change');
            // Added for retail_and_recreation_percent_change_from_baseline
            AveProv_pieChart('chart3', provinceLabels, Prov_average_retail, 'Retail mobility change % over 10 months', 'Average Retail and Recreation Mobility Change');
        });
});

function AveProv_chart(canvasId, labels, data, chartLabel, yAxisLabel) { // Added for retail_and_recreation_percent_change_from_baseline
    var ctx = document.getElementById(canvasId).getContext('2d'); //get the canvas element then get the context
    var myChart = new Chart(ctx, {
        type: 'line', //chart type
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: '#03fca9',
                borderColor: '#004d33',
                borderWidth: 2,
                hoverBackgroundColor: '#03fca9',
            }, {
                type: 'line',
                label: 'Average',
                fill: false,
                data: Array(data.length).fill(data.reduce((a, b) => a + b, 0) / data.length), //get an array to calculate the average
                borderColor: 'rgba(127, 0, 0, 1)', //set the border colour
                borderWidth: 1,
                borderDash: [5, 5]
            }]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        beginAtZero: true,
                        callback: function (value, index, values) {
                            return value + ' %';
                        }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel //add the y axis title
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Province by short code' //add the x axis title
                    }
                }
            }
        }
    });
}

function AveProv_chart_bar(canvasId, labels, data, chartLabel, yAxisLabel) { //bar chart duplicate from the line chart
    var ctx = document.getElementById(canvasId).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: '#03fca9',
                borderColor: '#004d33',
                borderWidth: 2,
                hoverBackgroundColor: '#03fca9',
            }, {
                type: 'line',
                label: 'Average',
                fill: false,
                data: Array(data.length).fill(data.reduce((a, b) => a + b, 0) / data.length),
                borderColor: 'rgba(127, 0, 0, 1)',
                borderWidth: 1,
                borderDash: [5, 5]
            }]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        beginAtZero: true,
                        callback: function (value, index, values) {
                            return value + ' %';
                        }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Province by short code'
                    }
                }
            }
        }
    });
}

function AveProv_pieChart(canvasId, labels, data, chartLabel) {
    var ctx = document.getElementById(canvasId).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#c93c32',
                    '#de8f3a',
                    '#dede3a',
                    '#6dde35',
                    '#35debf',
                    '#287aa6',
                    '#2135a6',
                    '#6126bf',
                    '#b526bf',
                    '#5c3e41',
                ],
                hoverOffset: 4
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: chartLabel
                }
            }
        }
    });
}