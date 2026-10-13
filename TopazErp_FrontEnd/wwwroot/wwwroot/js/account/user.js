document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Mock API response
        const response = {
            data: {
                result: {
                    user: {
                        id: 'user-001',
                        name: 'Akosua',
                        surname: 'Odamme Addae',
                        userName: 'akosua.odamme',
                        emailAddress: 'akosua.odamme@example.com'
                    },
                    tenant: {
                        id: 'tenant-001',
                        name: 'SISCO Ghana'
                    }
                }
            }
        };

        const info = response.data.result;
        const user = info?.user;
        const tenant = info?.tenant;

        if (!user) {
            document.getElementById('userFullName').textContent =
                'Not signed in';

            document.getElementById('userTenantName').textContent = '';
            return;
        }

        const name = [user.name]
            .filter(Boolean)
            .join(' ')
            .trim() || user.userName || 'User';

        const fullName = [user.surname, user.name]
            .filter(Boolean)
            .join(' ')
            .trim() || user.userName || 'User';

        const initials = name
            .split(/[\s._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('');

        const initialsLg = fullName
            .split(/[\s._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('');

        const tenantName = tenant?.name || 'Topaz ERP';

        document.getElementById('userFullName').textContent =
            `${tenantName} / ${name}`;

        document.getElementById('userInitials').textContent = initials;
        document.getElementById('userInitialsLg').textContent = initialsLg;
        document.getElementById('userFullNameLg').textContent = fullName;

        document.getElementById('userEmail').textContent =
            user.emailAddress || '';

        document.getElementById('initials').textContent = initials;
        document.getElementById('name').textContent = fullName;

    } catch (error) {
        console.error(
            'Unable to load current user information:',
            error.response?.data || error.message
        );

        document.getElementById('userFullName').textContent =
            'Unable to load profile';

        document.getElementById('userTenantName').textContent = '';
    }
});