
function saveOptions () {

	var mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video'];

	numOfmimeTypes = mimeTypes.length;
	
	var mimeSettings = {
			application: '',
			image: '',
			message: '',
			model: '',
			multipart: '',
			text: '',
			video: ''	
		}

	for ( i=0; i < numOfmimeTypes; i++ ) {
		var settings = document.getElementsByName(mimeTypes[i]);

		var download = settings[0].checked;
		var pocket = settings[1].checked;
		var ignore = settings[2].checked;

		if(download){
			mimeSettings[mimeTypes[i]] = 'download';
		}
		else if(pocket){
			mimeSettings[mimeTypes[i]] = 'pocket';
		}
		else if(ignore){
			mimeSettings[mimeTypes[i]] = 'ignore';
		}
	}

	chrome.storage.sync.set(mimeSettings , function () {
		var status = document.getElementsById('status');
		status.textContent = 'Options saved.';
		setTimeout( function () {
			status.textContent = '';
		}, 750);
	});
}

function getSettings ( ) {
	var mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video'];

	var numOfmimeTypes = mimeTypes.length;

	for ( i=0; i < numOfmimeTypes; i++ ) {
		var settings = document.getElementsByName(mimeTypes[i]);

		var download = settings[0].checked;
		var pocket = settings[1].checked;
		var ignore = settings[2].checked;

	}
}

function setSettings ( items ) {
	var mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video'];
	
	var numOfmimeTypes = mimeTypes.length;

	for ( i=0; i < numOfmimeTypes; i++ ) {
		var settings = document.getElementsByName(mimeTypes[i]);

		settings[0].checked = false;
		settings[1].checked = false;
		settings[2].checked = false;

		if( items[mimeTypes[i]] == 'download') {
			settings[0].checked = true;
		}
		else if ( items[mimeTypes[i]] == 'pocket' ) {
			settings[1].checked = true;
		}
		else if ( items[mimeTypes[i]] == 'ignore' ) {
			settings[2].checked = true;
		}
	}
}

function restoreOptions () {
	chrome.storage.sync.get({
		application: 'download',
		image: 'download',
		message: 'ignore',
		model: 'ignore',
		multipart: 'ignore',
		text: 'download',
		video: 'download'
	}, function ( items ) {
		setSettings( items );
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions );
document.getElementById('settings').addEventListener('submit', saveOptions );