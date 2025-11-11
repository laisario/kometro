import React from 'react'

function useUserWithPermission(users) {
  const usersWithPermission = users?.filter((user) => user?.groups?.some((group) => group?.name === 'gerente' || group?.name === 'registrador'))
  return {usersWithPermission}
}

export default useUserWithPermission