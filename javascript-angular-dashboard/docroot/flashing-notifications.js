/*========================================================================================================
=            FLashing notifications https://github.com/maciejsaw/jQuery-FlashingNotifications            =
========================================================================================================*/
var FlashingNotifications = (function() {

	var FlashingNotifications__timerOne = {};
	var FlashingNotifications__timerTwo = {};

	function hideNotification(notificationType) {
		//find and cache selected html object
		var $notificationBox = $('[js-selector="flashing-notification__'+notificationType+'"]');

		$notificationBox.addClass('is-transparent');
		clearTimeout(FlashingNotifications__timerTwo[notificationType]);
		FlashingNotifications__timerTwo[notificationType] = setTimeout(function() {
			$notificationBox.addClass('is-hidden');
		}, 800);
	}

	var closeButtonAlreadyBinded = false;
	function bindCloseButton() {
		if (closeButtonAlreadyBinded === false) {
			$(document).on('click.flashingNotifications', '[flashing-notifications__action-close-notification="true"]', function() {
				closeButtonAlreadyBinded = true;
				var $notificationBox = $(this).closest('[js-selector^="flashing-notification__"]');
				$notificationBox.addClass('is-transparent');
				setTimeout(function() {
					$notificationBox.addClass('is-hidden');
				}, 800);
			});
		}
	}
	
	function showAndHideNotification(notificationType, htmlToPlaceInsideNotification, timeToWaitBeforeHiding) {

		//default arguments
		if (typeof notificationType === 'undefined' || notificationType === "") {
			notificationType = "neutral";
		}
		if (typeof timeToWaitBeforeHiding === 'undefined' || timeToWaitBeforeHiding === "") {
			timeToWaitBeforeHiding = 3500;
		}
    
		//find and cache selected html object
		var $notificationBox = $('[js-selector="flashing-notification__'+notificationType+'"]');    

		var updateNotificationBoxText = function() {
			//only update html if argument provided
			if (htmlToPlaceInsideNotification !== "" || typeof htmlToPlaceInsideNotification !== 'undefined'); {
				$notificationBox.find('[js-selector="flashing-notification-text"]').html(htmlToPlaceInsideNotification);
			}
		};

		var showAndHideNotificationBox = function() {
			$notificationBox.removeClass('is-hidden');
			setTimeout(function() {
				$notificationBox.removeClass('is-transparent');

				clearTimeout(FlashingNotifications__timerOne[notificationType]);
				clearTimeout(FlashingNotifications__timerTwo[notificationType]);

				FlashingNotifications__timerOne[notificationType] = setTimeout(function() {
					hideNotification(notificationType);
				}, timeToWaitBeforeHiding);

			}, 20);
		};

		//If there's already a notification shown, first hide it and then show another one
		if ($notificationBox.hasClass('is-hidden') === false && $notificationBox.hasClass('is-transparent') === false) {
			hideNotification(notificationType);
			setTimeout(function() {
				updateNotificationBoxText();
				showAndHideNotificationBox();
			}, 1000);
		} else { //else simply show and hide notification
			updateNotificationBoxText();
			showAndHideNotificationBox();
		}

		bindCloseButton();

	}

	function hideAllNotifications() {
		hideNotification('success');
		hideNotification('error');
		hideNotification('neutral');
	}

	//TODO: options to disable hiding or separate method to just show and then automatically enforce X button, option to show and hide X button

	return {
		showAndHideNotification: showAndHideNotification,
		hideNotification: hideNotification,
		hideAllNotifications: hideAllNotifications
	};

})();
/*=====  End of FLashing notifications https://github.com/maciejsaw/jQuery-FlashingNotifications  ======*/