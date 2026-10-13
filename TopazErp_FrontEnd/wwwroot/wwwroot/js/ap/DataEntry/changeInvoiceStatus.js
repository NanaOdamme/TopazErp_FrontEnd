// Show modal when page loads
$(document).ready(function () {
    $('#changeStatusModal').modal('show');

    $('#proceedBtn').click(function () {
        const selectedAction = $('input[name="invoiceAction"]:checked').val();

        if (selectedAction === 'edit') {
            window.location.href = '/ApDataEntry/EditPostedInvoice';
        } else if (selectedAction === 'cancel') {
            window.location.href = '/ApDataEntry/CancelPostedInvoice';
        }
    });

});